/*******************************************************************************************/
/* Analysis of RBC Component Effects on Vital Parameters.sas (3 of 3 scripts)              */
/*                                                                                         */
/* Revised to add significance tests for observed Pre vs Post differences by RBC factor    */
/* MODIFIED: Added Type 3 interaction p-values for time x component factor effects         */
/* CRITICAL FIX: Improved model-based CI calculation using Scoring Row approach            */
/*                                                                                         */
/* REVISION HISTORY:                                                                       */
/* December 2025 - Added trajectory-based change estimates using ESTIMATE statements       */
/*   with nonpositional spline syntax. This uses the full spline model (±720 min) to       */
/*   estimate the T-60 to T+60 change for each factor category, with proper inference.     */
/*   Added CONTRAST statement for omnibus test of whether trajectory-based changes         */
/*   differ by component factor.                                                           */
/*                                                                                         */
/* P-VALUES CALCULATED:                                                                    */
/* 1. InteractionPValue: Tests if entire trajectory shapes differ by factor (Type 3)      */
/* 2. ChangeModelPValue: Tests if T±60 change differs by factor (separate change model)   */
/* 3. TrajChangePValue: Tests if spline-predicted T±60 change differs (trajectory model)  */
/*                                                                                         */
/* Author: SCANDAT Research Group                                                          */
/* Last modified: December 2025                                                            */
/*******************************************************************************************/
/*===============================================================================
SECTION 1: ENVIRONMENT SETUP
===============================================================================*/
/* Set up temporary work library */
options dlcreatedir;
libname HPCWORK "<PROJECT_ROOT>\analysis\sas_temporary_work_s3";

/* Clean temporary datasets to prevent conflicts */
proc datasets lib=HPCWORK nolist kill;
quit;

/* Global options */
%global timeTicks interval_minutes min_time max_time baseline_interval;

/* Time parameters for analysis windows */
%let interval_minutes=60; /* Hourly predictions */
%let baseline_interval=-60; /* 1 hour pre-transfusion baseline */
%let min_time=-720; /* 12 hours before transfusion */
%let max_time=720; /* 12 hours post-transfusion */
/* For consistency with your original transfusion-effect code,
define a small extension around +/-60 minutes (commonly +/-1). */
%let extension_minutes=5;

/* Create time axis tick marks for consistent plotting */
%macro build_time_ticks(step=60);
    data _null_;
        length valstr $1000;
        valstr="";
        do t=&min_time to &max_time by &step;
            valstr=catx(" ", valstr, put(t,best12.));
        end;
        call symputx("timeTicks", valstr);
    run;
%mend build_time_ticks;
%build_time_ticks(step=60);

/* Permanent libraries for data and output */
libname mydata "<SOURCE_DATA_PATH>";
options dlcreatedir;
libname outlib "<PROJECT_ROOT>\analysis\sas_output";
libname viz "<PROJECT_ROOT>\analysis\sas_viz_s3";

/* Clear visualization library */
proc datasets lib=viz nolist kill;
quit;

/* Define plot output directory */
%let plot_path=<PROJECT_ROOT>\analysis\plots;
ODS LISTING GPATH="&plot_path";

/* Enable graphics with large observation limit for complex curves */
ods graphics on / loessmaxobs=1000000 imagename="ComponentEffect";

/*===============================================================================
SECTION 2: DATA LOADING AND PREPARATION
===============================================================================*/
/* Define dataset name if not provided (default to sample) */
/* Define dataset name: Use sysparm if provided, otherwise default to sample */
%let dataset_name=%sysfunc(ifc(%length(&sysparm)>0, &sysparm,
    transvital3_sample));

/* Load primary dataset */
data HPCWORK.transvital_raw;
    set mydata.&dataset_name; /* Dynamic dataset loading */
    /* Create unique transfusion event ID */
    length TransfusionID_char $50;
    if missing(TransfusionID_char) then TransfusionID_char=catx('_',
        put(PatientID,best12.), put(TransDt,e8601dt19.));
run;

/* Calculate minutes relative to transfusion and standardize variable names */
data HPCWORK.transvital_raw;
    set HPCWORK.transvital_raw;
    TimeFromTransfusion=(Datetime - TransDt)/60;
    rename Age=PatientAge Sex=PatientSex;
run;

/* Sort for sequential processing */
proc sort data=HPCWORK.transvital_raw out=HPCWORK.raw_sorted;
    by PatientID TransDt;
run;

/* Track transfusion sequence by patient */
data HPCWORK.transvital_withcount;
    set HPCWORK.raw_sorted;
    by PatientID;
    retain RBC_Count 0;
    if first.PatientID then RBC_Count=0;
    RBC_Count + 1;
run;

/* Create component factor categories for analysis */
data HPCWORK.transvital_withcategories;
    set HPCWORK.transvital_withcount;

    /* Donor hemoglobin categories */
    length DonorHb_Cat 8;
    if missing(DonorHb) then DonorHb_Cat=.;
    else if DonorHb < 125 then DonorHb_Cat=1; /* <125 g/L */
    else if 125 <= DonorHb <= 139 then DonorHb_Cat=2; /* 125-139 g/L */
    else if 140 <= DonorHb <= 154 then DonorHb_Cat=3; /* 140-154 g/L */
    else if 155 <= DonorHb <= 169 then DonorHb_Cat=4; /* 155-169 g/L */
    else if DonorHb >= 170 then DonorHb_Cat=5; /* >=170 g/L */
    else DonorHb_Cat=.;

    /* Storage time categories */
    length Storage_Cat 8;
    if missing(storage) then Storage_Cat=.;
    else if storage < 10 then Storage_Cat=1; /* <10 days */
    else if 10 <= storage <= 19 then Storage_Cat=2; /* 10-19 days */
    else if 20 <= storage <= 29 then Storage_Cat=3; /* 20-29 days */
    else if 30 <= storage <= 39 then Storage_Cat=4; /* 30-39 days */
    else if storage >= 40 then Storage_Cat=5; /* >=40 days */
    else Storage_Cat=.;

    /* Donor sex validation (1=male, 2=female) */
    if DonorSex not in (1, 2) then DonorSex=.;

    /* Donor parity validation (0=nulliparous, 1=parous) */
    if DonorParity not in (0, 1) then DonorParity=.;

    /* Donation day of week validation (1-7) */
    if wdy_donation not in (1, 2, 3, 4, 5, 6, 7) then wdy_donation=.;
run;

/* Create long-format dataset with analysis variables */
data HPCWORK.rbc_long;
    set HPCWORK.transvital_withcategories;
    keep PatientID TransfusionID_char PatientAge PatientSex AdmissionTime
        TransDt TimeFromTransfusion Abbreviation Value RBC_Count ICU_time
        Crystalloid_1 Crystalloid_24 Sedatives_1 Sedatives_24 Pressors_1
        Pressors_24 WardName DonorHb_Cat Storage_Cat DonorSex DonorParity
        wdy_donation;
    /* Time in ICU before transfusion */
    ICU_time=(TransDt - AdmissionTime)/60;
    if ICU_time < 0 then ICU_time=0; /* Ensure non-negative values */
run;

/* Define vital parameters and their display labels */
%global vitals vitalsSAS Headers YLabels n_vitals;
/* WARNING: 'Hjärtfrekv' contains a special character. Ensure your SAS session encoding matches the file encoding (utf-8 vs latin1) or update this string. */
%let vitals=ARTm^ARTs^ARTd^Hjärtfrekv^FIO2(u)^SpO2^VE(u);
%let vitalsSAS=ARTm^ARTs^ARTd^HR^FIO2^SpO2^VE;
%let Headers=Vital Parameter Trajectory: Mean Arterial Pressure (mmHg)^ Vital
    Parameter Trajectory: Systolic Blood Pressure (mmHg)^ Vital Parameter
    Trajectory: Diastolic Blood Pressure (mmHg)^ Vital Parameter Trajectory:
    Heart Rate (bpm)^ Vital Parameter Trajectory: Fraction of Inspired Oxygen
    (%)^ Vital Parameter Trajectory: Peripheral Capillary Oxygen Saturation (%)^
    Vital Parameter Trajectory: Minute Ventilation (L/min);
%let YLabels=MAP (mmHg)^ SBP (mmHg)^ DBP (mmHg)^ HR (bpm)^ FiO2 (%)^ SpO2 (%)^
    VE (L/min);
%let n_vitals=7;

/* Define component factors and labels */
%global comp_factors comp_names comp_labels n_factors;
%let comp_factors=DonorHb_Cat^Storage_Cat^DonorSex^DonorParity^wdy_donation;
%let comp_names=Donor Hemoglobin^ RBC Storage Time^ Donor Sex^ Donor Parity^
    Weekday of Donation;
%let comp_labels=Effect of Donor Hemoglobin on^ Effect of RBC Storage Time on^
    Effect of Donor Sex on^ Effect of Donor Parity on^ Effect of Weekday of
    Donation on;
%let n_factors=5;

/*===============================================================================
SECTION 3: COMPONENT FACTOR ANALYSIS MACRO
===============================================================================*/
%macro analyze_component_vital(i=, j=);
    %local this_vital this_vitalSAS this_head this_y this_comp_factor
        this_comp_name this_comp_label;
    %let this_vital=%scan(&vitals,&i,^);
    %let this_vitalSAS=%scan(&vitalsSAS,&i,^);
    %let this_head=%qscan(&Headers,&i,^);
    %let this_y=%qscan(&YLabels,&i,^);
    %let this_comp_factor=%scan(&comp_factors,&j,^);
    %let this_comp_name=%qscan(&comp_names,&j,^);
    %let this_comp_label=%qscan(&comp_labels,&j,^);

    /* Extract data for current vital parameter */
    data _one_vital;
        length Abbreviation $30 source $5 TransfusionID_char $50 DonorParity 8;
        set HPCWORK.rbc_long;
        where Abbreviation="&this_vital";
        source='REAL';
        Sedatives_1_bin=(Sedatives_1 > 0);
        Sedatives_24_bin=(Sedatives_24 > 0);
    run;

    /* Get most common ward for consistency in prediction rows */
    proc freq data=_one_vital order=freq;
        tables WardName / noprint out=_ward_freq;
    run;

    data _null_;
        set _ward_freq (obs=1);
        call symputx('this_ward_mode', WardName);
    run;

    /* Calculate covariate means for prediction standardization */
    proc means data=_one_vital noprint;
        var PatientAge ICU_time RBC_Count Crystalloid_1 Crystalloid_24
            Pressors_1 Pressors_24 Sedatives_1_bin Sedatives_24_bin;
        output out=_averages mean=mean_age mean_icu mean_rbc mean_cryst1
            mean_cryst24 mean_press1 mean_press24 mean_sed1_bin mean_sed24_bin;
    run;

    data _null_;
        set _averages;
        call symputx('this_mean_age', mean_age);
        call symputx('this_mean_icu', mean_icu);
        call symputx('this_mean_rbc', mean_rbc);
        call symputx('this_mean_cryst1', mean_cryst1);
        call symputx('this_mean_cryst24', mean_cryst24);
        call symputx('this_mean_press1', mean_press1);
        call symputx('this_mean_press24', mean_press24);
        call symputx('this_mean_sed1_bin', mean_sed1_bin);
        call symputx('this_mean_sed24_bin', mean_sed24_bin);
    run;

    /* Get component factor category frequencies */
    proc freq data=_one_vital noprint;
        tables &this_comp_factor / out=_comp_freq;
    run;

    data _comp_freq;
        set _comp_freq;
        if missing(&this_comp_factor) then delete;
        if count=0 then delete;
    run;

    proc sort data=_comp_freq;
        by &this_comp_factor;
    run;

    data _null_;
        if 0 then set _comp_freq nobs=n;
        call symputx('n_categories', n);
    run;

    data _null_;
        set _comp_freq;
        call symputx('cat_'||left(_n_), &this_comp_factor);
    run;

    /* Create prediction dataset with all factor categories */
    data _score_full;
        length Abbreviation $30 source $5 TransfusionID_char $50 WardName $66
            DonorParity 8;
        do cat=1 to &n_categories;
            if cat=1 then comp_value=&cat_1;
            %do k=2 %to &n_categories;
                else if cat=&k then comp_value=&&cat_&k;
            %end;

            do t=&min_time to &max_time;
                Abbreviation="&this_vital";
                source='SCORE';
                PatientID=999999;
                TransfusionID_char="Dummy_999";
                TimeFromTransfusion=t;
                Value=.;
                &this_comp_factor=comp_value;
                PatientAge=&this_mean_age;
                ICU_time=&this_mean_icu;
                RBC_Count=&this_mean_rbc;
                PatientSex="M";
                Crystalloid_1=&this_mean_cryst1;
                Crystalloid_24=&this_mean_cryst24;
                Pressors_1=&this_mean_press1;
                Pressors_24=&this_mean_press24;
                Sedatives_1_bin=&this_mean_sed1_bin;
                Sedatives_24_bin=&this_mean_sed24_bin;
                WardName="&this_ward_mode";
                output;
            end;
        end;
        drop cat comp_value;
    run;

    data _one_vital_real;
        set _one_vital;
    run;

    data _both;
        set _one_vital_real _score_full;
    run;

    /* Fit BASE model with component factor and basic adjustments */
    title1 "&this_comp_label &this_head - Base Model";

    /* NEW: Capture Type 3 test results for interaction p-values */
    ods output Tests3=_type3_base;

    proc hpmixed data=_both;
        class PatientID TransfusionID_char PatientSex WardName
            &this_comp_factor;
        effect spl_time=spline(TimeFromTransfusion / naturalcubic
            knotmethod=list(-660 -360 -60 0 60 360 660));
        effect spl_age=spline(PatientAge / naturalcubic
            knotmethod=percentiles(3));
        effect spl_icu=spline(ICU_time / naturalcubic
            knotmethod=percentiles(3));

        model Value=spl_time | &this_comp_factor spl_age spl_icu RBC_Count
            PatientSex WardName / solution;

        test spl_time &this_comp_factor spl_time*&this_comp_factor / htype=3;

        random intercept / subject=PatientID;
        output out=_pred_base pred(noblup)=PredVal_Base
            stderr(noblup)=StdErrVal_Base;
    run;

    ods output close;

    /* Fit FULLY ADJUSTED model with additional clinical covariates */
    title1 "&this_comp_label &this_head - Fully Adjusted Model";

    /* Capture: Type 3 tests, trajectory-based ESTIMATE results, and CONTRAST omnibus test */
    ods output Tests3=_type3_full Estimates=_traj_estimates Contrasts=_traj_contrasts;

    proc hpmixed data=_both;
        class PatientID TransfusionID_char PatientSex WardName
            &this_comp_factor;
        effect spl_time=spline(TimeFromTransfusion / naturalcubic
            knotmethod=list(-660 -360 -60 0 60 360 660));
        effect spl_age=spline(PatientAge / naturalcubic
            knotmethod=percentiles(3));
        effect spl_icu=spline(ICU_time / naturalcubic
            knotmethod=percentiles(3));
        effect spl_cryst1=spline(Crystalloid_1 / naturalcubic
            knotmethod=percentiles(3));
        effect spl_cryst24=spline(Crystalloid_24 / naturalcubic
            knotmethod=percentiles(3));
        effect spl_press1=spline(Pressors_1 / naturalcubic
            knotmethod=percentiles(3));
        effect spl_press24=spline(Pressors_24 / naturalcubic
            knotmethod=percentiles(3));

        model Value=spl_time | &this_comp_factor spl_age spl_icu RBC_Count
            PatientSex spl_cryst1 spl_cryst24 spl_press1 spl_press24
            Sedatives_1_bin Sedatives_24_bin WardName / solution;

        test spl_time &this_comp_factor spl_time*&this_comp_factor / htype=3;

        /*=======================================================================
        TRAJECTORY-BASED CHANGE ESTIMATES (T-60 to T+60 from spline model)

        Uses nonpositional syntax for constructed spline effects:
        - spl_time [-1,-60] [1,60] = main effect contribution (change from T=-60 to T=+60)
        - spl_time*factor [-1, k -60] [1, k 60] = interaction contribution for category k

        The ordinal position k (1,2,3...) refers to the sorted order of factor categories.
        These estimates use the FULL trajectory model fitted over ±720 minutes, but
        extract the specific T=-60 to T=+60 change with proper variance estimation.
        =======================================================================*/

        /* Generate ESTIMATE statement for each factor category */
        %do _k=1 %to &n_categories;
            estimate "TrajChange Cat &&cat_&_k"
                spl_time [-1,-60] [1,60]
                spl_time*&this_comp_factor [-1,&_k -60] [1,&_k 60] / cl;
        %end;

        /*=======================================================================
        OMNIBUS TEST: Do trajectory-based changes differ across factor categories?

        Tests H0: Change_1 = Change_2 = ... = Change_n
        Implemented as n-1 consecutive pairwise contrasts.
        The main effect spl_time cancels out, so only the interaction terms are needed.
        =======================================================================*/
        %if &n_categories > 1 %then %do;
            contrast 'TrajChange Omnibus'
            %do _k=1 %to %eval(&n_categories - 1);
                /* Test: Change for category _k = Change for category _k+1 */
                /* Equivalently: (interaction at T=60 for cat_k) - (interaction at T=-60 for cat_k)
                               - (interaction at T=60 for cat_k+1) + (interaction at T=-60 for cat_k+1) = 0 */
                spl_time*&this_comp_factor [-1,&_k -60] [1,&_k 60] [1,%eval(&_k+1) -60] [-1,%eval(&_k+1) 60]
                %if &_k < %eval(&n_categories - 1) %then %do;
                    ,
                %end;
            %end;
            ;
        %end;

        random intercept / subject=PatientID;
        output out=_pred_full pred(noblup)=PredVal_Full
            stderr(noblup)=StdErrVal_Full lcl(noblup)=Lower_Full
            ucl(noblup)=Upper_Full;
    run;

    ods output close;

    title1;

    /*===================================================================
    NEW: Save Type 3 test results with vital/factor identifiers
    ====================================================================*/
    data _type3_base_labeled;
        length Abbreviation $30 FactorName $30 Model $20;
        set _type3_base;
        Abbreviation="&this_vital";
        FactorName="&this_comp_factor";
        Model="Base";
    run;

    data _type3_full_labeled;
        length Abbreviation $30 FactorName $30 Model $20;
        set _type3_full;
        Abbreviation="&this_vital";
        FactorName="&this_comp_factor";
        Model="FullyAdjusted";
    run;

    data HPCWORK.save_type3_base_&i._&j;
        set _type3_base_labeled;
    run;

    data HPCWORK.save_type3_full_&i._&j;
        set _type3_full_labeled;
    run;

    /*===================================================================
    NEW: Save trajectory-based change estimates and omnibus test results
    These come from ESTIMATE and CONTRAST statements in the spline model
    ====================================================================*/

    /* Label trajectory-based change estimates for each factor category */
    data _traj_estimates_labeled;
        length Abbreviation $30 FactorName $30;
        set _traj_estimates;
        Abbreviation="&this_vital";
        FactorName="&this_comp_factor";
    run;

    data HPCWORK.save_traj_estimates_&i._&j;
        set _traj_estimates_labeled;
    run;

    /* Label and save trajectory-based omnibus contrast test */
    /* This tests H0: all factor categories have equal T-60 to T+60 change */
    data _traj_contrasts_labeled;
        length Abbreviation $30 FactorName $30;
        set _traj_contrasts;
        Abbreviation="&this_vital";
        FactorName="&this_comp_factor";
        /* Rename ProbF to TrajChangePValue for clarity */
        rename ProbF=TrajChangePValue;
    run;

    data HPCWORK.save_traj_contrasts_&i._&j;
        set _traj_contrasts_labeled;
    run;

    /* Extract prediction rows for visualization */
    data _scorepred_base;
        set _pred_base;
        if source='SCORE';
        keep TimeFromTransfusion &this_comp_factor PredVal_Base StdErrVal_Base;
    run;

    data _scorepred_full;
        set _pred_full;
        if source='SCORE';
        keep TimeFromTransfusion &this_comp_factor PredVal_Full StdErrVal_Full
            Lower_Full Upper_Full;
    run;

    proc sort data=_scorepred_base;
        by &this_comp_factor TimeFromTransfusion;
    run;

    proc sort data=_scorepred_full;
        by &this_comp_factor TimeFromTransfusion;
    run;

    data _pred_all;
        merge _scorepred_base _scorepred_full;
        by &this_comp_factor TimeFromTransfusion;
    run;

    proc sort data=_pred_all out=_pred_sorted;
        by &this_comp_factor TimeFromTransfusion;
    run;

    data _baseline;
        set _pred_sorted;
        if TimeFromTransfusion=&baseline_interval then output;
        keep &this_comp_factor PredVal_Base PredVal_Full Lower_Full Upper_Full;
        rename PredVal_Base=base_val_base PredVal_Full=base_val_full Lower_Full=
            base_lower_full Upper_Full=base_upper_full;
    run;

    proc sort data=_baseline;
        by &this_comp_factor;
    run;

    data _delta_plot_final;
        merge _pred_sorted(in=a) _baseline(in=b);
        by &this_comp_factor;
        if a;
        Delta_Base=PredVal_Base - base_val_base;
        Delta_Full=PredVal_Full - base_val_full;
        Delta_Lower=Lower_Full - base_val_full;
        Delta_Upper=Upper_Full - base_val_full;
    run;

    data viz.viz_&this_vitalSAS._&this_comp_factor;
        set _delta_plot_final;
        length VitalParam $30 CompFactor $30 CompName $50 VitalName $100 YLabel
            $100 DeltaYLabel $100;
        VitalParam="&this_vitalSAS";
        CompFactor="&this_comp_factor";
        CompName="&this_comp_name";
        VitalName="&this_head";
        YLabel="&this_y";
        DeltaYLabel="Change in &this_y";
        drop base_val_: ;
    run;

    proc sql;
        insert into viz.viz_index select distinct "&this_vitalSAS" as
            VitalParam, "&this_comp_factor" as CompFactor, "&this_comp_name" as
            CompName, "&this_head" as VitalName, "&this_y" as YLabel,
            "Change in &this_y" as DeltaYLabel from _pred_all(obs=1);
    quit;

    proc sql noprint;
        create table _time_select as select &this_comp_factor,
            TimeFromTransfusion, PredVal_Base, StdErrVal_Base, PredVal_Full,
            StdErrVal_Full from _pred_all where TimeFromTransfusion in
            (&baseline_interval, &interval_minutes) order by &this_comp_factor,
            TimeFromTransfusion;
    quit;

    data _time_select_wide;
        set _time_select;
        by &this_comp_factor;
        retain Base_Pre Base_Pre_SE Full_Pre Full_Pre_SE Base_Post Base_Post_SE
            Full_Post Full_Post_SE;
        if TimeFromTransfusion=&baseline_interval then do;
            Base_Pre=PredVal_Base;
            Base_Pre_SE=StdErrVal_Base;
            Full_Pre=PredVal_Full;
            Full_Pre_SE=StdErrVal_Full;
        end;
        else if TimeFromTransfusion=&interval_minutes then do;
            Base_Post=PredVal_Base;
            Base_Post_SE=StdErrVal_Base;
            Full_Post=PredVal_Full;
            Full_Post_SE=StdErrVal_Full;
        end;
        if last.&this_comp_factor then output;
        keep &this_comp_factor Base_Pre Full_Pre Base_Post Full_Post;
    run;

    /*==========================================================================*/
    /* CORRECTED: Model-based summary using change model with SCORING ROW       */
    /*==========================================================================*/

    /* Step 1: Calculate pre and post averages with covariates for each transfusion */
    proc sql noprint;
        create table _pre_avg_model as select distinct a.&this_comp_factor,
            a.TransfusionID_char, a.PatientID, a.PatientAge, a.PatientSex,
            a.ICU_time, a.RBC_Count, a.WardName, a.Crystalloid_1,
            a.Crystalloid_24, a.Pressors_1, a.Pressors_24, a.Sedatives_1_bin,
            a.Sedatives_24_bin, mean(a.Value) as Pre_Value from _one_vital a
            where a.TimeFromTransfusion >= -(&interval_minutes +
            &extension_minutes) and a.TimeFromTransfusion <= -(&interval_minutes
            - &extension_minutes) and a.&this_comp_factor is not missing group
            by a.&this_comp_factor, a.TransfusionID_char, a.PatientID,
            a.PatientAge, a.PatientSex, a.ICU_time, a.RBC_Count, a.WardName,
            a.Crystalloid_1, a.Crystalloid_24, a.Pressors_1, a.Pressors_24,
            a.Sedatives_1_bin, a.Sedatives_24_bin;
    quit;

    proc sql noprint;
        create table _post_avg_model as select &this_comp_factor,
            TransfusionID_char, mean(Value) as Post_Value from _one_vital where
            TimeFromTransfusion >= (&interval_minutes - &extension_minutes) and
            TimeFromTransfusion <= (&interval_minutes + &extension_minutes) and
            &this_comp_factor is not missing group by &this_comp_factor,
            TransfusionID_char;
    quit;

    /* Step 2: Merge and compute change (outcome for change model) */
    proc sort data=_pre_avg_model;
        by &this_comp_factor TransfusionID_char;
    run;

    proc sort data=_post_avg_model;
        by &this_comp_factor TransfusionID_char;
    run;

    data _change_model;
        merge _pre_avg_model(in=a) _post_avg_model(in=b);
        by &this_comp_factor TransfusionID_char;
        if a and b;
        Change=Post_Value - Pre_Value;
    run;

    /* Step 3: Create prediction dataset with proper covariates for SCORING */

    /* This ensures valid inference for each factor category using the model */
    data _score_change;
        length Abbreviation $30 TransfusionID_char $50 PatientSex $1 WardName
            $66 DonorParity 8;
        Abbreviation="&this_vital";
        TransfusionID_char="SCORE_999";
        PatientID=999999;
        /* Covariates at mean */
        PatientAge=&this_mean_age;
        ICU_time=&this_mean_icu;
        RBC_Count=&this_mean_rbc;
        PatientSex="M";
        WardName="&this_ward_mode";
        Crystalloid_1=&this_mean_cryst1;
        Crystalloid_24=&this_mean_cryst24;
        Pressors_1=&this_mean_press1;
        Pressors_24=&this_mean_press24;
        Sedatives_1_bin=&this_mean_sed1_bin;
        Sedatives_24_bin=&this_mean_sed24_bin;
        Change=.;

        /* Create one scoring row per category */
        do cat=1 to &n_categories;
            if cat=1 then comp_value=&cat_1;
            %do k=2 %to &n_categories;
                else if cat=&k then comp_value=&&cat_&k;
            %end;
            &this_comp_factor=comp_value;
            output;
        end;
        drop cat comp_value;
    run;

    data _change_both;
        set _change_model _score_change;
    run;

    /* Step 4: Fit BASE change model (scoring row approach) */
    ods select none;

    proc hpmixed data=_change_both;
        class PatientID PatientSex WardName &this_comp_factor;
        effect spl_age=spline(PatientAge / naturalcubic
            knotmethod=percentiles(3));
        effect spl_icu=spline(ICU_time / naturalcubic
            knotmethod=percentiles(3));
        model Change=&this_comp_factor spl_age spl_icu RBC_Count PatientSex
            WardName / solution;
        random intercept / subject=PatientID;
        output out=_pred_base_change pred(noblup)=Pred_Change
            stderr(noblup)=SE_Change lcl(noblup)=LCL_Change
            ucl(noblup)=UCL_Change;
    run;
    ods select all;

    /* Step 5: Fit FULL change model (scoring row approach) */
    ods select none;
    /* NEW: Capture Type 3 tests for Omnibus P-Value */
    ods output Tests3=_type3_change;

    proc hpmixed data=_change_both;
        class PatientID PatientSex WardName &this_comp_factor;
        effect spl_age=spline(PatientAge / naturalcubic
            knotmethod=percentiles(3));
        effect spl_icu=spline(ICU_time / naturalcubic
            knotmethod=percentiles(3));
        effect spl_cryst1=spline(Crystalloid_1 / naturalcubic
            knotmethod=percentiles(3));
        effect spl_cryst24=spline(Crystalloid_24 / naturalcubic
            knotmethod=percentiles(3));
        effect spl_press1=spline(Pressors_1 / naturalcubic
            knotmethod=percentiles(3));
        effect spl_press24=spline(Pressors_24 / naturalcubic
            knotmethod=percentiles(3));
        model Change=&this_comp_factor spl_age spl_icu RBC_Count PatientSex
            WardName spl_cryst1 spl_cryst24 spl_press1 spl_press24
            Sedatives_1_bin Sedatives_24_bin / solution;

        /* Explicitly test the component factor effect on Change */
        test &this_comp_factor / htype=3;

        random intercept / subject=PatientID;
        output out=_pred_full_change pred(noblup)=Pred_Change
            stderr(noblup)=SE_Change lcl(noblup)=LCL_Change
            ucl(noblup)=UCL_Change;
    run;
    ods select all;
    ods output close;

    /* Step 6: Extract results and merge into summary */
    data _lsm_base_change;
        set _pred_base_change;
        where PatientID=999999;
        keep &this_comp_factor Pred_Change SE_Change LCL_Change UCL_Change;
        rename Pred_Change=Base_Diff_Change SE_Change=Base_Diff_SE_Change
            LCL_Change=Base_Diff_LCL_Change UCL_Change=Base_Diff_UCL_Change;
    run;

    data _lsm_full_change;
        set _pred_full_change;
        where PatientID=999999;
        keep &this_comp_factor Pred_Change SE_Change LCL_Change UCL_Change;
        rename Pred_Change=Full_Diff_Change SE_Change=Full_Diff_SE_Change
            LCL_Change=Full_Diff_LCL_Change UCL_Change=Full_Diff_UCL_Change;
    run;

    proc sort data=_lsm_base_change;
        by &this_comp_factor;
    run;

    proc sort data=_lsm_full_change;
        by &this_comp_factor;
    run;

    proc sort data=_time_select_wide;
        by &this_comp_factor;
    run;

    /* EXTRACT: Save Type 3 test from Change Model
       This tests whether factor affects the T-60 to T+60 change using OBSERVED data
       Renamed to ChangeModelPValue for clarity (separate model, not from trajectory spline) */
    data _type3_change_labeled;
        length Abbreviation $30 FactorName $30 Model $20;
        set _type3_change;
        if Effect="&this_comp_factor";
        /* Keep only the main effect of interest */
        Abbreviation="&this_vital";
        FactorName="&this_comp_factor";
        Model="ChangeModel";
        keep Abbreviation FactorName Model ProbF;
        rename ProbF=ChangeModelPValue;
    run;

    data HPCWORK.save_factor_model_&i._&j;
        length Abbreviation $30 FactorName $30 FactorCategory $30;
        /* Merge in p-values (same for all rows of this factor/vital):
           - ChangeModelPValue: From separate change model using observed T±60 data
           - TrajChangePValue: From trajectory spline model CONTRAST at T±60 */
        if _n_=1 then do;
            set _type3_change_labeled(keep=ChangeModelPValue);
            set _traj_contrasts_labeled(keep=TrajChangePValue);
        end;

        merge _time_select_wide _lsm_base_change _lsm_full_change;
        by &this_comp_factor;

        Abbreviation="&this_vital";
        FactorName="&this_comp_factor";
        FactorCategory=cats(&this_comp_factor);

        /* CORRECTED: Use change model results for Diff, SE, and CI */
        Base_Diff=Base_Diff_Change;
        Base_Diff_SE=Base_Diff_SE_Change;
        Base_Diff_LCL=Base_Diff_LCL_Change;
        Base_Diff_UCL=Base_Diff_UCL_Change;

        Full_Diff=Full_Diff_Change;
        Full_Diff_SE=Full_Diff_SE_Change;
        Full_Diff_LCL=Full_Diff_LCL_Change;
        Full_Diff_UCL=Full_Diff_UCL_Change;

        drop Base_Diff_Change Base_Diff_SE_Change Base_Diff_LCL_Change
            Base_Diff_UCL_Change Full_Diff_Change Full_Diff_SE_Change
            Full_Diff_LCL_Change Full_Diff_UCL_Change;
    run;

    /* EXPORT: Save model-based stats (with P-value) to VIZ library for CSV export */
    data viz.stats_&this_vitalSAS._&this_comp_factor;
        set HPCWORK.save_factor_model_&i._&j;
    run;

    /*===================================================================
    Observed data summary (this was already correct - no changes needed)
    ====================================================================*/
    proc sql noprint;
        create table _pre_avg as select &this_comp_factor, TransfusionID_char,
            mean(Value) as Pre_Avg from _one_vital where TimeFromTransfusion >=
            -(&interval_minutes + &extension_minutes) and TimeFromTransfusion <=
            -(&interval_minutes - &extension_minutes) group by
            &this_comp_factor, TransfusionID_char;
    quit;

    proc sql noprint;
        create table _post_avg as select &this_comp_factor, TransfusionID_char,
            mean(Value) as Post_Avg from _one_vital where TimeFromTransfusion >=
            (&interval_minutes - &extension_minutes) and TimeFromTransfusion <=
            (&interval_minutes + &extension_minutes) group by &this_comp_factor,
            TransfusionID_char;
    quit;

    data _diff;
        merge _pre_avg(in=a) _post_avg(in=b);
        by &this_comp_factor TransfusionID_char;
        if a and b;
        Diff=Post_Avg - Pre_Avg;
    run;

    proc means data=_diff noprint;
        by &this_comp_factor;
        var Pre_Avg Post_Avg Diff;
        output out=_stats mean(Pre_Avg)=Pre_Mean std(Pre_Avg)=Pre_SD
            mean(Post_Avg)=Post_Mean std(Post_Avg)=Post_SD mean(Diff)=Diff_Mean
            stderr(Diff)=Diff_SE n(Diff)=NDiff;
    run;

    data _stats;
        set _stats;
        Diff_LCL=Diff_Mean - 1.96 * Diff_SE;
        Diff_UCL=Diff_Mean + 1.96 * Diff_SE;
        if NDiff>1 then do;
            Diff_T=Diff_Mean / Diff_SE;
            df=NDiff - 1;
            p_value=2*(1 - probt(abs(Diff_T), df));
        end;
        else do;
            Diff_T=.;
            df=.;
            p_value=.;
        end;
    run;

    data HPCWORK.save_factor_observed_&i._&j;
        length Abbreviation $30 FactorName $30 FactorCategory $30;
        merge _stats;
        by &this_comp_factor;
        Abbreviation="&this_vital";
        FactorName="&this_comp_factor";
        FactorCategory=cats(&this_comp_factor);
    run;

    /* Clean up - including new datasets */
    proc datasets lib=work nolist nowarn;
        delete _one_vital _one_vital_real _score_full _scorepred_base
            _scorepred_full _averages _ward_freq _comp_freq _both _pred_base
            _pred_full _pred_all _pred_sorted _baseline _delta_plot_final
            _time_select _time_select_wide _pre_avg _post_avg _diff _stats
            _type3_base _type3_full _type3_base_labeled _type3_full_labeled
            _pre_avg_model _post_avg_model _change_model _lsm_base_change
            _lsm_full_change _score_change _change_both _pred_base_change
            _pred_full_change _type3_change _type3_change_labeled
            _traj_estimates _traj_contrasts _traj_estimates_labeled
            _traj_contrasts_labeled;
    quit;
%mend analyze_component_vital;

/*===============================================================================
SECTION 4: EXECUTE ANALYSIS FOR ALL COMBINATIONS
===============================================================================*/
data viz.viz_index;
    length VitalParam $30 CompFactor $30 CompName $50 VitalName $100 YLabel $100
        DeltaYLabel $100;
run;

%macro run_all_combinations;
    %local i j;
    %do i=1 %to &n_vitals;
        %do j=1 %to &n_factors;
            %analyze_component_vital(i=&i, j=&j);
        %end;
    %end;
%mend run_all_combinations;

%run_all_combinations;

/* MODIFIED: Save Type 3 datasets too */
/* Removed cleanup block that incorrectly targeted WORK library */
options dlcreatedir;
%let csv_path=<PROJECT_ROOT>\analysis\script_data;
libname CSVOUT "&csv_path";
libname CSVOUT clear;

%macro export_datasets_to_csv;
    data _null_;
        file "&csv_path\viz_index.csv";
        put "VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel";
    run;

    proc sql noprint;
        select memname into :dslist separated by ' ' from dictionary.tables
            where libname='VIZ' and memname ne 'VIZ_INDEX';
    quit;

    %let num_ds=%sysfunc(countw(&dslist));
    %do i=1 %to &num_ds;
        %let dsname=%scan(&dslist, &i);

        proc export data=viz.&dsname outfile="&csv_path\&dsname..csv" dbms=csv
            replace;
        run;

        data _null_;
            set viz.&dsname(obs=1);
            file "&csv_path\viz_index.csv" mod;
            put VitalParam "," CompFactor "," CompName "," VitalName "," YLabel
                "," DeltaYLabel;
        run;
    %end;
%mend;

%export_datasets_to_csv;

/*===============================================================================
SECTION 5: SUMMARY TABLES (existing outputs preserved)
===============================================================================*/
data HPCWORK.tableFactors1;
    length Abbreviation $30 FactorName $30 FactorCategory $30;
    set HPCWORK.save_factor_observed_:;
    label Pre_Mean="Pre-Transfusion Mean" Pre_SD="Pre-Transfusion SD" Post_Mean=
        "Post-Transfusion Mean" Post_SD="Post-Transfusion SD" Diff_Mean=
        "Mean Difference" Diff_LCL="95% CI Lower" Diff_UCL="95% CI Upper" Diff_T
        ="T statistic" p_value="p-value" Abbreviation="Vital Sign" FactorName
        ="RBC Factor" FactorCategory="Factor Class";
run;

data HPCWORK.tableFactors2;
    length Abbreviation $30 FactorName $30 FactorCategory $30;
    set HPCWORK.save_factor_model_:;
    label Base_Pre="Base Pre-Transfusion" Full_Pre=
        "Fully Adjusted Pre-Transfusion" Base_Post="Base Post-Transfusion"
        Full_Post="Fully Adjusted Post-Transfusion" Base_Diff=
        "Base Mean Difference" Base_Diff_LCL="Base 95% CI Lower"
        Base_Diff_UCL="Base 95% CI Upper" Full_Diff=
        "Fully Adjusted Mean Difference"
        Full_Diff_LCL="Fully Adjusted 95% CI Lower"
        Full_Diff_UCL="Fully Adjusted 95% CI Upper" Abbreviation="Vital Sign"
        FactorName="RBC Factor" FactorCategory="Factor Class"
        ChangeModelPValue="P-value (Change Model: T±60 observed)"
        TrajChangePValue="P-value (Trajectory Model: T±60 spline)";
run;

/*===============================================================================
SECTION 6: NEW - Type 3 Interaction Tests Summary Table
- Combines all Type 3 test results from Base and Fully Adjusted models
- Exports interaction p-values for omnibus testing of factor effects
===============================================================================*/
data HPCWORK.type3_base_all;
    length Abbreviation $30 FactorName $30 Model $20;
    set HPCWORK.save_type3_base_:;
run;

data HPCWORK.type3_full_all;
    length Abbreviation $30 FactorName $30 Model $20;
    set HPCWORK.save_type3_full_:;
run;

data HPCWORK.type3_all;
    set HPCWORK.type3_base_all HPCWORK.type3_full_all;
run;

/* Create pivoted summary with one row per Vital+Factor - interaction only */
proc sql;
    create table HPCWORK.interaction_tests_summary as select base.Abbreviation,
        base.FactorName, base.NumDF as Base_NumDF, base.DenDF as Base_DenDF,
        base.FValue as Base_FValue, base.ProbF as Base_ProbF, full.NumDF as
        Full_NumDF, full.DenDF as Full_DenDF, full.FValue as Full_FValue,
        full.ProbF as Full_ProbF from (select * from HPCWORK.type3_base_all
        where Effect contains '*') as base left join (select * from
        HPCWORK.type3_full_all where Effect contains '*') as full on
        base.Abbreviation=full.Abbreviation and base.FactorName=full.FactorName
        order by base.Abbreviation, base.FactorName;
quit;

data HPCWORK.interaction_tests_summary;
    set HPCWORK.interaction_tests_summary;
    /* Rename p-values to InteractionPValue for clarity:
       These test whether the ENTIRE trajectory shape (spl_time*factor) differs by factor
       This is different from TrajChangePValue which tests if the T-60 to T+60 change differs */
    rename Base_ProbF=Base_InteractionPValue Full_ProbF=Full_InteractionPValue;
    label Abbreviation="Vital Parameter" FactorName="Component Factor"
        Base_NumDF="Base Model: Numerator DF"
        Base_DenDF="Base Model: Denominator DF"
        Base_FValue="Base Model: F Value"
        Base_InteractionPValue="Base Model: Interaction P-value (entire trajectory)"
        Full_NumDF="Fully Adjusted: Numerator DF"
        Full_DenDF="Fully Adjusted: Denominator DF"
        Full_FValue="Fully Adjusted: F Value"
        Full_InteractionPValue="Fully Adjusted: Interaction P-value (entire trajectory)";
run;

/* Print final tables */
title
    "Table 1: Observed Pre vs Post (+/-1 hour), with Significance Tests, by RBC Factor/Class";

proc print data=HPCWORK.tableFactors1 noobs label;
    var Abbreviation FactorName FactorCategory Pre_Mean Pre_SD Post_Mean Post_SD
        Diff_Mean Diff_LCL Diff_UCL Diff_T p_value;
run;
title;

title "Table 2: Model-Based Summary of RBC Factor/Class Effects";
title2 "Note: CIs calculated using change model (scoring row method)";

proc print data=HPCWORK.tableFactors2 noobs label;
    var Abbreviation FactorName FactorCategory Base_Pre Full_Pre Base_Post
        Full_Post Base_Diff Base_Diff_LCL Base_Diff_UCL Full_Diff Full_Diff_LCL
        Full_Diff_UCL;
run;
title;
title2;

title
    "Table 3: Type 3 Interaction Tests - Does Component Factor Modify Transfusion Effect?";
title2
    "Tests whether vital parameter trajectories differ by component factor category";

proc print data=HPCWORK.interaction_tests_summary noobs label;
    var Abbreviation FactorName Base_NumDF Base_DenDF Base_FValue Base_InteractionPValue
        Full_NumDF Full_DenDF Full_FValue Full_InteractionPValue;
    format Base_InteractionPValue Full_InteractionPValue pvalue6.4;
run;
title;

/*===============================================================================
SECTION 7: NEW - Trajectory-Based Change Summary Tables
- Combines ESTIMATE results: T-60 to T+60 change per factor category from spline model
- Combines CONTRAST results: Omnibus test of whether changes differ by factor
===============================================================================*/

/* Combine all trajectory-based estimates (per-category change from spline model) */
data HPCWORK.traj_estimates_all;
    length Abbreviation $30 FactorName $30;
    set HPCWORK.save_traj_estimates_:;
    label Estimate="Trajectory-Based Change (T+60 - T-60)"
          StdErr="Standard Error"
          tValue="t Value"
          Probt="P-value (Category vs 0)"
          Lower="95% CI Lower"
          Upper="95% CI Upper";
run;

/* Combine all trajectory-based contrast results (omnibus tests) */
data HPCWORK.traj_contrasts_all;
    length Abbreviation $30 FactorName $30;
    set HPCWORK.save_traj_contrasts_:;
    label TrajChangePValue="P-value (Trajectory-Based Omnibus)"
          NumDF="Numerator DF"
          DenDF="Denominator DF"
          FValue="F Value";
run;

/* Print trajectory-based omnibus test results */
title "Table 4: Trajectory-Based Omnibus Tests - Do T±60 Changes Differ by Factor?";
title2 "Uses CONTRAST from full spline model (±720 min) evaluated at T=-60 and T=+60";

proc print data=HPCWORK.traj_contrasts_all noobs label;
    var Abbreviation FactorName NumDF DenDF FValue TrajChangePValue;
    format TrajChangePValue pvalue6.4;
run;
title;

/* Export to CSV - existing outputs preserved */
proc export data=HPCWORK.tableFactors1
    outfile="&csv_path\factor_observed_data_summary.csv" dbms=csv replace;
run;

proc export data=HPCWORK.tableFactors2
    outfile="&csv_path\factor_model_based_summary.csv" dbms=csv replace;
run;

/* NEW: Export interaction tests summary */
proc export data=HPCWORK.interaction_tests_summary
    outfile="&csv_path\interaction_tests_summary.csv" dbms=csv replace;
run;

/* NEW: Export full Type 3 tests for complete reference */
proc export data=HPCWORK.type3_all outfile="&csv_path\type3_tests_all.csv"
    dbms=csv replace;
run;

/* NEW: Export trajectory-based estimates (per-category T±60 changes from spline model) */
proc export data=HPCWORK.traj_estimates_all
    outfile="&csv_path\traj_change_estimates.csv" dbms=csv replace;
run;

/* NEW: Export trajectory-based omnibus tests (do changes differ by factor?) */
proc export data=HPCWORK.traj_contrasts_all
    outfile="&csv_path\traj_change_omnibus_tests.csv" dbms=csv replace;
run;

/*==========================================================================*/
/*  SECTION 8: CLEANUP - Remove temporary files and SAS datasets            */
/*==========================================================================*/

/* Clean up HPCWORK library - remove all temporary SAS datasets */
proc datasets lib=HPCWORK nolist kill;
quit;

/* Clean up VIZ library - remove all SAS datasets (CSVs already exported) */
proc datasets lib=viz nolist kill;
quit;

/* Clean up WORK library */
proc datasets lib=work nolist kill;
quit;

/* Clear the libname assignments */
libname HPCWORK clear;
libname viz clear;
libname outlib clear;

/* End of program */
