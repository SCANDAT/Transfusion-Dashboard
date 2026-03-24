/**************************************************************************************/
/* Analysis of RBC Transfusion Effect on Vital Parameters.sas (2 of 3 scripts)        */
/*                                                                                    */
/* Analysis script for the effect of RBC transfusions on vital parameters. This code: */
/* - Analyzes the impact of blood transfusions on patient vital signs using repeated  */
/*   measures mixed effects models with natural cubic splines and discrete models     */
/* - Outputs tables and visualizations of findings to SAS Results Viewer              */
/* - Generates CSV files for downstream visualization dashboard                       */
/*                                                                                    */
/* Author: SCANDAT Research Group, Lucas D. Ekstrom                                   */
/* Last modified: March 2025                                                          */
/*                                                                                    */
/* REVISION HISTORY:                                                                  */
/* December 2025 - CRITICAL FIX: Corrected model-based CI calculation for Table 2.   */
/*   Previous version incorrectly assumed independence when computing SE of the      */
/*   difference between predictions at T-1h and T+1h. This inflated confidence       */
/*   intervals. Now uses a direct "change model" approach that properly accounts     */
/*   for correlation structure and gives valid inference.                            */
/**************************************************************************************/
/*==========================================================================*/
/*  SECTION 1: ENVIRONMENT SETUP                                            */
/*==========================================================================*/
/*--- Set up temporary work library ---*/
options dlcreatedir;
libname HPCWORK "<PROJECT_ROOT>\analysis\sas_temporary_work_s2";

/* Clean up datasets from previous runs */
proc datasets lib=HPCWORK nolist kill;
quit;

/*--- Global parameter settings ---*/
%global timeTicks yMin yMax interval_minutes baseline_interval;

/* Key time interval parameters */
%let interval_minutes=60;
%let extension_minutes=5;
%let baseline_interval=-60;

/* X-axis time range for plots (in minutes) */
%let min_time=-720;
%let max_time=720;

/* Smoothing factor range for LOESS plot */
%let LOESS_min=10;
%let LOESS_max=90;
%let LOESS_step=1;

/* Macro to create evenly spaced tick marks for time axis */
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

/* Data and output libraries */
libname mydata "<SOURCE_DATA_PATH>";
options dlcreatedir;
libname outlib "<PROJECT_ROOT>\analysis\sas_output";

/* Visualization output directory */
options dlcreatedir;
libname viz "<PROJECT_ROOT>\analysis\sas_viz_s2";

/* Clean visualization library */
proc datasets lib=viz nolist kill;
quit;

/* Create index dataset for visualization */
data viz.viz_index;
   length VitalParam $30 CompFactor $30 CompName $50 VitalName $100 YLabel $100
      DeltaYLabel $100;
run;

/* Define plot output directory */
%let plot_path=<PROJECT_ROOT>\analysis\plots;
ODS LISTING GPATH="&plot_path";

/* Enable ODS graphics with increased observation limit for LOESS */
ods graphics on / loessmaxobs=1000000 imagename="TransfusionEffect";

/*==========================================================================*/
/*  SECTION 2: DATA LOADING AND PREPARATION                                 */
/*==========================================================================*/
/* Define dataset name: Use sysparm if provided, otherwise default to sample */
%let dataset_name=%sysfunc(ifc(%length(&sysparm)>0, &sysparm,
   transvital3_sample));

/* Load and prepare transfusion-vital signs data */
data HPCWORK.transvital_raw;
   set mydata.&dataset_name;
   length TransfusionID_char $50;
   if missing(TransfusionID_char) then TransfusionID_char=catx('_',
      put(PatientID,best12.), put(TransDt,e8601dt19.));
run;

/* Calculate time relative to transfusion and rename demographic variables */
data HPCWORK.transvital_raw;
   set HPCWORK.transvital_raw;
   TimeFromTransfusion=(Datetime - TransDt)/60;
   rename Age=PatientAge Sex=PatientSex;
run;

/* Sort data by patient and transfusion date */
proc sort data=HPCWORK.transvital_raw out=HPCWORK.raw_sorted;
   by PatientID TransDt;
run;

/* Count RBC transfusions per patient */
data HPCWORK.transvital_withcount;
   set HPCWORK.raw_sorted;
   by PatientID;
   retain RBC_Count 0;
   if first.PatientID then RBC_Count=0;
   RBC_Count + 1;
run;

/* Restructure data for analysis */
data HPCWORK.rbc_long;
   set HPCWORK.transvital_withcount;
   keep PatientID TransfusionID_char PatientAge PatientSex AdmissionTime TransDt
      TimeFromTransfusion Abbreviation Value RBC_Count ICU_time Crystalloid_1
      Crystalloid_24 Sedatives_1 Sedatives_24 Pressors_1 Pressors_24 WardName;
   ICU_time=(TransDt - AdmissionTime)/60;
   if ICU_time < 0 then ICU_time=0;
run;

/* Calculate z-scores for standardization */
proc sort data=HPCWORK.rbc_long;
   by Abbreviation;
run;

proc means data=HPCWORK.rbc_long noprint;
   by Abbreviation;
   var Value;
   output out=HPCWORK.vital_stats mean=GlobalMean std=GlobalStd;
run;

data HPCWORK.rbc_long_z;
   merge HPCWORK.rbc_long HPCWORK.vital_stats;
   by Abbreviation;
   if GlobalStd>0 then Value_Z=(Value - GlobalMean)/GlobalStd;
   else Value_Z=.;
run;

/* Define vital signs to analyze */
%global vitals Headers YLabels n_vitals;
%let vitals=ARTm^ARTs^ARTd^Hjärtfrekv^FIO2(u)^SpO2^VE(u);
%global vitalsSAS;
%let vitalsSAS=ARTm^ARTs^ARTd^HR^FIO2^SpO2^VE;
%let Headers=Vital Parameter Trajectory: Mean Arterial Pressure (mmHg)^ Vital
   Parameter Trajectory: Systolic Blood Pressure (mmHg)^ Vital Parameter
   Trajectory: Diastolic Blood Pressure (mmHg)^ Vital Parameter Trajectory:
   Heart Rate (bpm)^ Vital Parameter Trajectory: Fraction of Inspired Oxygen
   (%)^ Vital Parameter Trajectory: Peripheral Capillary Oxygen Saturation (%)^
   Vital Parameter Trajectory: Minute Ventilation (L/min);
%let YLabels=MAP (mmHg)^ SBP (mmHg)^ DBP (mmHg)^ HR (bpm)^ FiO2 (%)^ SpO2 (%)^
   VE(u) (L/min);
%let n_vitals=7;

/*==========================================================================*/
/*  SECTION 3: MAIN ANALYSIS MACRO                                          */

/*==========================================================================*/
%macro analyze_vital(i=);
   %local this_vital this_head this_y this_delta_head;
   %let this_vital=%scan(&vitals,&i,^);
   %let this_head=%qscan(&Headers,&i,^);
   %let this_y=%qscan(&YLabels,&i,^);
   %let this_delta_head=Vital Parameter Change Trajectory:
      %scan(%qscan(&Headers,&i,^),2,':');

   /* Extract data for this vital sign */
   data _one_vital;
      length Abbreviation $30 source $5 TransfusionID_char $50;
      set HPCWORK.rbc_long;
      where Abbreviation="&this_vital";
      source='REAL';
      Sedatives_1_bin=(Sedatives_1 > 0);
      Sedatives_24_bin=(Sedatives_24 > 0);
   run;

   /* Determine modal ward name for this vital sign */
   proc freq data=_one_vital order=freq;
      tables WardName / noprint out=_ward_freq;
   run;

   data _null_;
      set _ward_freq(obs=1);
      call symputx('this_ward_mode', WardName);
   run;

   /* Calculate covariate averages for model scoring */
   proc means data=_one_vital noprint;
      var PatientAge ICU_time RBC_Count Crystalloid_1 Crystalloid_24 Pressors_1
         Pressors_24 Sedatives_1_bin Sedatives_24_bin;
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

   /* Create prediction dataset for time series plots */
   data _score_full;
      length Abbreviation $30 source $5 TransfusionID_char $50 WardName $66;
      do t=&min_time to &max_time;
         Abbreviation="&this_vital";
         source='SCORE';
         PatientID=999999;
         TransfusionID_char="Dummy_999";
         TimeFromTransfusion=t;
         Value=.;
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
   run;

   data _one_vital_real;
      set _one_vital;
   run;

   data _both;
      set _one_vital_real _score_full;
   run;

   /* Fit Base model without crystalloids, vasopressors and sedatives */
   ods select none;
   ods output CovParms=_randvar FitStatistics=_fitstats;

   proc hpmixed data=_both;
      class PatientID TransfusionID_char PatientSex WardName;
      effect spl_time=spline(TimeFromTransfusion / naturalcubic
         knotmethod=list(-660 -360 -60 0 60 360 660));
      effect spl_age=spline(PatientAge / naturalcubic
         knotmethod=percentiles(3));
      effect spl_icu=spline(ICU_time / naturalcubic knotmethod=percentiles(3));
      model Value=spl_time spl_age spl_icu RBC_Count PatientSex WardName /
         solution;

      random intercept / subject=PatientID;
      output out=_pred_base pred(noblup)=PredVal_Base
         stderr(noblup)=StdErrVal_Base;
   run;
   ods select all;

   /* Display random effects & fit statistics */
   title1 "&this_head";
   title2 "Random Effects (CovParms) & Fit Statistics";

   proc print data=_randvar noobs label;
      var CovParm Subject Estimate;
      label CovParm="Random Parm" Subject="Subject/Class" Estimate="Estimate";
   run;

   proc print data=_fitstats noobs label;
      title2 "Fit Statistics => &this_head";
   run;
   title2;

   /* Fit Fully adjusted model with additional covariates */
   ods select none;
   ods output CovParms=_randvar FitStatistics=_fitstats;

   proc hpmixed data=_both;
      class PatientID TransfusionID_char PatientSex WardName;
      effect spl_time=spline(TimeFromTransfusion / naturalcubic
         knotmethod=list(-660 -360 -60 0 60 360 660));
      effect spl_age=spline(PatientAge / naturalcubic
         knotmethod=percentiles(3));
      effect spl_icu=spline(ICU_time / naturalcubic knotmethod=percentiles(3));
      effect spl_cryst1=spline(Crystalloid_1 / naturalcubic
         knotmethod=percentiles(3));
      effect spl_cryst24=spline(Crystalloid_24 / naturalcubic
         knotmethod=percentiles(3));
      effect spl_press1=spline(Pressors_1 / naturalcubic
         knotmethod=percentiles(3));
      effect spl_press24=spline(Pressors_24 / naturalcubic
         knotmethod=percentiles(3));

      model Value=spl_time spl_age spl_icu RBC_Count PatientSex spl_cryst1
         spl_cryst24 spl_press1 spl_press24 Sedatives_1_bin Sedatives_24_bin
         WardName / solution;

      random intercept / subject=PatientID;
      output out=_pred_full pred(noblup)=PredVal_Full
         stderr(noblup)=StdErrVal_Full lcl(noblup)=Lower_Full
         ucl(noblup)=Upper_Full;
   run;
   ods select all;

   /* Extract prediction rows for plotting */
   data _scorepred_base;
      set _pred_base;
      if source='SCORE';
      keep TimeFromTransfusion PredVal_Base StdErrVal_Base;
   run;

   data _scorepred_full;
      set _pred_full;
      if source='SCORE';
      keep TimeFromTransfusion PredVal_Full StdErrVal_Full Lower_Full
         Upper_Full;
   run;

   proc sort data=_scorepred_base;
      by TimeFromTransfusion;
   run;

   proc sort data=_scorepred_full;
      by TimeFromTransfusion;
   run;

   data _pred_all;
      merge _scorepred_base _scorepred_full;
      by TimeFromTransfusion;
   run;

   /* Calculate dynamic y-axis range for plots */
   proc means data=_pred_all noprint;
      var PredVal_Base PredVal_Full Lower_Full Upper_Full;
      output out=_bounds min=MinBase MinFull MinLower MinUpper max=MaxBase
         MaxFull MaxUpper;
   run;

   data _null_;
      set _bounds;
      overall_min=min(MinBase, MinFull, MinLower);
      overall_max=max(MaxBase, MaxFull, MaxUpper);
      range=overall_max - overall_min;
      yMin=overall_min - 0.75 * range;
      yMax=overall_max + 0.75 * range;
      call symputx("yMin", yMin);
      call symputx("yMax", yMax);
   run;

   /* Store data for grid layout */
   data HPCWORK.abs_&i;
      set _pred_all;
      length VitalName $50;
      VitalParam="&this_vital";
      if VitalParam="ARTs" then do;
         VitalName="Systolic Blood Pressure";
         PlotOrder=2;
      end;
      else if VitalParam="ARTd" then do;
         VitalName="Diastolic Blood Pressure";
         PlotOrder=3;
      end;
      else if VitalParam="ARTm" then do;
         VitalName="Mean Arterial Pressure";
         PlotOrder=1;
      end;
      else if VitalParam="Hjärtfrekv" then do;
         VitalName="Heart Rate";
         PlotOrder=4;
      end;
      else if VitalParam="FIO2(u)" then do;
         VitalName="Fraction of Inspired Oxygen";
         PlotOrder=5;
      end;
      else if VitalParam="SpO2" then do;
         VitalName="Peripheral Capillary Oxygen Saturation";
         PlotOrder=6;
      end;
      else if VitalParam="VE(u)" then do;
         VitalName="Minute Ventilation";
         PlotOrder=7;
      end;
      min_val=&yMin;
      max_val=&yMax;
   run;

   /* Plot comparing base vs fully adjusted models */
   title1 "&this_head";

   proc sgplot data=_pred_all;
      series x=TimeFromTransfusion y=PredVal_Base / lineattrs=(color=red
         pattern=dash thickness=2) legendlabel="Base Model";

      series x=TimeFromTransfusion y=PredVal_Full / lineattrs=(color=green
         pattern=solid thickness=3) legendlabel="Fully Adjusted Model";

      band x=TimeFromTransfusion lower=Lower_Full upper=Upper_Full /
         fillattrs=(color=green) transparency=0.9
         legendlabel="95% CI Fully Adjusted Model";

      refline 0 / axis=x lineattrs=(color=red thickness=2)
         label="Transfusion=0";
      xaxis label="Time from Transfusion (min)" values=(&timeTicks);
      yaxis label="&this_y" min=&yMin max=&yMax;
   run;

   /* Calculate baseline for delta plots */
   data _delta_data;
      set _pred_all;
      retain base_val_base base_val_full base_lower_full base_upper_full;
      if _n_=1 then do;
         base_val_base=.;
         base_val_full=.;
         base_lower_full=.;
         base_upper_full=.;
      end;
      if TimeFromTransfusion=&baseline_interval then do;
         base_val_base=PredVal_Base;
         base_val_full=PredVal_Full;
         base_lower_full=Lower_Full;
         base_upper_full=Upper_Full;
      end;
   run;

   proc sql noprint;
      select PredVal_Base, PredVal_Full, Lower_Full, Upper_Full into
         :base_val_base, :base_val_full, :base_lower_full, :base_upper_full from
         _pred_all where TimeFromTransfusion=&baseline_interval;
   quit;

   /* Create delta plot data (change from baseline) */
   data _delta_plot;
      set _pred_all;
      Delta_Base=PredVal_Base - &base_val_base;
      Delta_Full=PredVal_Full - &base_val_full;
      Delta_Lower=Lower_Full - &base_val_full;
      Delta_Upper=Upper_Full - &base_val_full;
   run;

   proc means data=_delta_plot noprint;
      var Delta_Base Delta_Full Delta_Lower Delta_Upper;
      output out=_delta_bounds min=MinDeltaBase MinDeltaFull MinDeltaLower
         MinDeltaUpper max=MaxDeltaBase MaxDeltaFull MaxDeltaUpper
         MaxDeltaLower;
   run;

   data _null_;
      set _delta_bounds;
      overall_min=min(MinDeltaBase, MinDeltaFull, MinDeltaLower);
      overall_max=max(MaxDeltaBase, MaxDeltaFull, MaxDeltaUpper);
      range=overall_max - overall_min;
      delta_min=overall_min - 0.75 * range;
      delta_max=overall_max + 0.75 * range;
      call symputx("delta_min", delta_min);
      call symputx("delta_max", delta_max);
   run;

   /* Store delta data for grid layout */
   data HPCWORK.delta_&i;
      set _delta_plot;
      length VitalName $50;
      VitalParam="&this_vital";
      if VitalParam="ARTs" then do;
         VitalName="Systolic Blood Pressure";
         PlotOrder=2;
      end;
      else if VitalParam="ARTd" then do;
         VitalName="Diastolic Blood Pressure";
         PlotOrder=3;
      end;
      else if VitalParam="ARTm" then do;
         VitalName="Mean Arterial Pressure";
         PlotOrder=1;
      end;
      else if VitalParam="Hjärtfrekv" then do;
         VitalName="Heart Rate";
         PlotOrder=4;
      end;
      else if VitalParam="FIO2(u)" then do;
         VitalName="Fraction of Inspired Oxygen";
         PlotOrder=5;
      end;
      else if VitalParam="SpO2" then do;
         VitalName="Peripheral Capillary Oxygen Saturation";
         PlotOrder=6;
      end;
      else if VitalParam="VE(u)" then do;
         VitalName="Minute Ventilation";
         PlotOrder=7;
      end;
      min_val=&delta_min;
      max_val=&delta_max;
   run;

   /* Plot changes from baseline */
   title1 "&this_delta_head";

   proc sgplot data=_delta_plot;
      series x=TimeFromTransfusion y=Delta_Base / lineattrs=(color=red
         pattern=dash thickness=2) legendlabel="Base Model";

      series x=TimeFromTransfusion y=Delta_Full / lineattrs=(color=green
         pattern=solid thickness=3) legendlabel="Fully Adjusted Model";

      band x=TimeFromTransfusion lower=Delta_Lower upper=Delta_Upper /
         fillattrs=(color=green) transparency=0.9
         legendlabel="95% CI Fully Adjusted Model";

      refline 0 / axis=x lineattrs=(color=red thickness=2)
         label="Transfusion=0";
      xaxis label="Time from Transfusion (min)" values=(&timeTicks);
      yaxis label="Change in &this_y" min=&delta_min max=&delta_max;
   run;
   title1;

   /* Create hourly prediction dataset for tables */
   data _score_hours;
      length Abbreviation $30 source $5 TransfusionID_char $50 WardName $66;
      Abbreviation="&this_vital";
      do hr=-4 to 4;
         TimeFromTransfusion=hr*60;
         source='SCORE';
         PatientID=999999;
         TransfusionID_char="Dummy_999";
         Value=.;
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
   run;

   data _one_vital_real2;
      set _one_vital;
   run;

   data _hours_both;
      set _one_vital_real2 _score_hours;
   run;

   /* Generate hourly predictions from base model */
   ods select none;
   ods output CovParms=_junk FitStatistics=_junkfit;

   proc hpmixed data=_hours_both;
      class PatientID TransfusionID_char PatientSex WardName;
      effect spl_time=spline(TimeFromTransfusion / naturalcubic
         knotmethod=list(-660 -360 -60 0 60 360 660));
      effect spl_age=spline(PatientAge / naturalcubic
         knotmethod=percentiles(3));
      effect spl_icu=spline(ICU_time / naturalcubic knotmethod=percentiles(3));
      model Value=spl_time spl_age spl_icu RBC_Count PatientSex WardName /
         solution;
      random intercept / subject=PatientID;
      output out=_hours_pred pred(noblup)=PredVal lcl(noblup)=Lower
         ucl(noblup)=Upper stderr(noblup)=StdErrVal;
   run;
   ods select all;

   /* Format hourly predictions for reporting */
   data _pred_hours;
      set _hours_pred;
      if source='SCORE';
      Hour=TimeFromTransfusion/60;
   run;

   title1 "Predicted Means at Hourly Intervals => &this_head";

   proc print data=_pred_hours noobs label;
      var Hour PredVal StdErrVal Lower Upper;
      label Hour="Hour (from Transfusion)" PredVal="Mean Prediction"
         StdErrVal="StdErr" Lower="95% LCL" Upper="95% UCL";
   run;
   title1;

   /* Calculate observed data summaries for Table 1 */
   proc sql noprint;
      create table _pre_avg as select Abbreviation, TransfusionID_char,
         mean(Value) as Pre_Avg from _one_vital where TimeFromTransfusion >= -
         (&interval_minutes + &extension_minutes) and TimeFromTransfusion <= -
         (&interval_minutes - &extension_minutes) group by Abbreviation,
         TransfusionID_char;
   quit;

   proc sql noprint;
      create table _post_avg as select Abbreviation, TransfusionID_char,
         mean(Value) as Post_Avg from _one_vital where TimeFromTransfusion >=
         (&interval_minutes - &extension_minutes) and TimeFromTransfusion <=
         (&interval_minutes + &extension_minutes) group by Abbreviation,
         TransfusionID_char;
   quit;

   /* Calculate differences pre/post transfusion */
   data _diff;
      merge _pre_avg(in=inpre) _post_avg(in=inpost);
      by Abbreviation TransfusionID_char;
      if inpre and inpost;
      Diff=Post_Avg - Pre_Avg;
   run;

   /* Summarize pre-transfusion statistics */
   proc means data=_pre_avg noprint;
      by Abbreviation;
      var Pre_Avg;
      output out=_pre_stats mean=Pre_Mean std=Pre_SD;
   run;

   /* Summarize post-transfusion statistics */
   proc means data=_post_avg noprint;
      by Abbreviation;
      var Post_Avg;
      output out=_post_stats mean=Post_Mean std=Post_SD;
   run;

   /* Calculate mean difference and confidence intervals */
   proc means data=_diff noprint;
      by Abbreviation;
      var Diff;
      output out=_diff_stats mean=Diff_Mean stderr=Diff_SE;
   run;

   data _diff_stats;
      set _diff_stats;
      Diff_LCL=Diff_Mean - 1.96 * Diff_SE;
      Diff_UCL=Diff_Mean + 1.96 * Diff_SE;
   run;

   /* Create Table 1 row for this vital sign */
   data _table1_row;
      merge _pre_stats(keep=Abbreviation Pre_Mean Pre_SD)
         _post_stats(keep=Abbreviation Post_Mean Post_SD)
         _diff_stats(keep=Abbreviation Diff_Mean Diff_LCL Diff_UCL);
      by Abbreviation;
      length Abbreviation $30;
      Abbreviation="&this_vital";
   run;

   proc append base=HPCWORK.table1 data=_table1_row force;
   run;

   /*==========================================================================*/
   /* CORRECTED: Model-based summary for Table 2                               */
   /*                                                                          */
   /* IMPORTANT FIX: The previous version incorrectly computed the SE of the   */
   /* difference as sqrt(SE_Pre^2 + SE_Post^2), which assumes independence.    */
   /* However, predictions at T=-60 and T=+60 from the same spline model are   */
   /* correlated, so this overestimated the SE and inflated confidence         */
   /* intervals.                                                               */
   /*                                                                          */
   /* NEW APPROACH: We use a "change model" that directly models the pre-post  */
   /* difference as the outcome variable. This gives proper inference because  */
   /* the model directly estimates the mean change and its SE, accounting for  */
   /* all sources of correlation (within-patient clustering, etc.).            */
   /*==========================================================================*/

   /* Step 1: Calculate pre and post averages with covariates for each transfusion */
   proc sql noprint;
      create table _pre_avg_model as select distinct a.Abbreviation,
         a.TransfusionID_char, a.PatientID, a.PatientAge, a.PatientSex,
         a.ICU_time, a.RBC_Count, a.WardName, a.Crystalloid_1, a.Crystalloid_24,
         a.Pressors_1, a.Pressors_24, a.Sedatives_1_bin, a.Sedatives_24_bin,
         mean(a.Value) as Pre_Value from _one_vital a where
         a.TimeFromTransfusion >= -(&interval_minutes + &extension_minutes) and
         a.TimeFromTransfusion <= -(&interval_minutes - &extension_minutes)
         group by a.Abbreviation, a.TransfusionID_char, a.PatientID,
         a.PatientAge, a.PatientSex, a.ICU_time, a.RBC_Count, a.WardName,
         a.Crystalloid_1, a.Crystalloid_24, a.Pressors_1, a.Pressors_24,
         a.Sedatives_1_bin, a.Sedatives_24_bin;
   quit;

   proc sql noprint;
      create table _post_avg_model as select Abbreviation, TransfusionID_char,
         mean(Value) as Post_Value from _one_vital where TimeFromTransfusion >=
         (&interval_minutes - &extension_minutes) and TimeFromTransfusion <=
         (&interval_minutes + &extension_minutes) group by Abbreviation,
         TransfusionID_char;
   quit;

   /* Step 2: Merge and compute change (outcome for change model) */
   proc sort data=_pre_avg_model;
      by Abbreviation TransfusionID_char;
   run;

   proc sort data=_post_avg_model;
      by Abbreviation TransfusionID_char;
   run;

   data _change_model;
      merge _pre_avg_model(in=a) _post_avg_model(in=b);
      by Abbreviation TransfusionID_char;
      if a and b;
      Change=Post_Value - Pre_Value;
   run;

   /* Step 3: Create scoring row at mean covariate values for prediction */

   /* This gives us the adjusted mean change with proper SE and CI */
   data _score_change;
      length Abbreviation $30 TransfusionID_char $50 PatientSex $1 WardName $66;
      Abbreviation="&this_vital";
      TransfusionID_char="SCORE_999";
      PatientID=999999;
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
   run;

   /* Combine real change data with scoring row */
   data _change_both;
      set _change_model _score_change;
   run;

   /* Step 4: Fit BASE change model and score at mean covariate values */
   ods select none;

   proc hpmixed data=_change_both;
      class PatientID PatientSex WardName;
      effect spl_age=spline(PatientAge / naturalcubic
         knotmethod=percentiles(3));
      effect spl_icu=spline(ICU_time / naturalcubic knotmethod=percentiles(3));
      model Change=spl_age spl_icu RBC_Count PatientSex WardName / solution;
      random intercept / subject=PatientID;
      output out=_pred_base_change pred(noblup)=Pred_Change
         stderr(noblup)=SE_Change lcl(noblup)=LCL_Change ucl(noblup)=UCL_Change;
   run;
   ods select all;

   /* Extract Base model prediction for the scoring row */
   data _null_;
      set _pred_base_change;
      where PatientID=999999;
      call symputx('Base_Diff_Change', Pred_Change);
      call symputx('Base_Diff_SE_Change', SE_Change);
      call symputx('Base_Diff_LCL_Change', LCL_Change);
      call symputx('Base_Diff_UCL_Change', UCL_Change);
   run;

   /* Step 5: Fit FULL change model and score at mean covariate values */
   ods select none;

   proc hpmixed data=_change_both;
      class PatientID PatientSex WardName;
      effect spl_age=spline(PatientAge / naturalcubic
         knotmethod=percentiles(3));
      effect spl_icu=spline(ICU_time / naturalcubic knotmethod=percentiles(3));
      effect spl_cryst1=spline(Crystalloid_1 / naturalcubic
         knotmethod=percentiles(3));
      effect spl_cryst24=spline(Crystalloid_24 / naturalcubic
         knotmethod=percentiles(3));
      effect spl_press1=spline(Pressors_1 / naturalcubic
         knotmethod=percentiles(3));
      effect spl_press24=spline(Pressors_24 / naturalcubic
         knotmethod=percentiles(3));
      model Change=spl_age spl_icu RBC_Count PatientSex WardName spl_cryst1
         spl_cryst24 spl_press1 spl_press24 Sedatives_1_bin Sedatives_24_bin /
         solution;
      random intercept / subject=PatientID;
      output out=_pred_full_change pred(noblup)=Pred_Change
         stderr(noblup)=SE_Change lcl(noblup)=LCL_Change ucl(noblup)=UCL_Change;
   run;
   ods select all;

   /* Extract Full model prediction for the scoring row */
   data _null_;
      set _pred_full_change;
      where PatientID=999999;
      call symputx('Full_Diff_Change', Pred_Change);
      call symputx('Full_Diff_SE_Change', SE_Change);
      call symputx('Full_Diff_LCL_Change', LCL_Change);
      call symputx('Full_Diff_UCL_Change', UCL_Change);
   run;

   /* Step 6: Get Pre/Post predicted values from trajectory model for display */

   /* (These are still valid point estimates for the trajectory at specific times) */
   proc sql noprint;
      select PredVal_Base, PredVal_Full into :Base_Pre, :Full_Pre from _pred_all
         where TimeFromTransfusion=-&interval_minutes;

      select PredVal_Base, PredVal_Full into :Base_Post, :Full_Post from
         _pred_all where TimeFromTransfusion=&interval_minutes;
   quit;

   /* Step 7: Create Table 2 row with CORRECTED confidence intervals */

   /* Use trajectory model for Pre/Post values, change model for Diff/SE/CI */
   data _table2_row;
      length Abbreviation $30;
      Abbreviation="&this_vital";

      /* Pre and Post values from trajectory model (for display) */
      Base_Pre=&Base_Pre;
      Base_Post=&Base_Post;
      Full_Pre=&Full_Pre;
      Full_Post=&Full_Post;

      /* CORRECTED: Diff, SE, and CI from change model (proper inference) */
      Base_Diff=&Base_Diff_Change;
      Base_Diff_SE=&Base_Diff_SE_Change;
      Base_Diff_LCL=&Base_Diff_LCL_Change;
      Base_Diff_UCL=&Base_Diff_UCL_Change;

      Full_Diff=&Full_Diff_Change;
      Full_Diff_SE=&Full_Diff_SE_Change;
      Full_Diff_LCL=&Full_Diff_LCL_Change;
      Full_Diff_UCL=&Full_Diff_UCL_Change;
   run;

   proc append base=HPCWORK.table2 data=_table2_row force;
   run;

   /* Export data for visualization tool */
   %local this_vitalSAS;
   %let this_vitalSAS=%scan(&vitalsSAS,&i,^);

   data viz.viz_&this_vitalSAS._Transfusion;
      set _delta_plot;
      length VitalParam $30 CompFactor $30 CompName $50 VitalName $100 YLabel
         $100 DeltaYLabel $100 Transfusion 8;
      VitalParam="&this_vitalSAS";
      CompFactor="Transfusion";
      CompName="Transfusion Effect";
      VitalName="&this_head";
      YLabel="&this_y";
      DeltaYLabel="Change in &this_y";
      Transfusion=1;
   run;

   proc sql;
      insert into viz.viz_index select distinct "&this_vitalSAS" as VitalParam,
         "Transfusion" as CompFactor, "Transfusion Effect" as CompName,
         "&this_head" as VitalName, "&this_y" as YLabel, "Change in &this_y" as
         DeltaYLabel from _delta_plot(obs=1);
   quit;

   proc datasets lib=work nolist nowarn;
      delete _one_vital _one_vital_real2 _score_full _scorepred_base
         _scorepred_full _hours_both _hours_pred _averages _junk _junkfit
         _one_vital_real _bounds _pred_base _pred_full _pred_all _randvar
         _fitstats _ward_freq _pre_avg _post_avg _diff _pre_stats _post_stats
         _diff_stats _table1_row _table2_row _delta_data _delta_plot
         _delta_bounds _pre_avg_model _post_avg_model _change_model
         _score_change _change_both _pred_base_change _pred_full_change;
   quit;
%mend analyze_vital;

/*==========================================================================*/
/*  SECTION 4: DISCRETE HOUR MODEL ANALYSIS                                 */

/*==========================================================================*/
%macro discrete_hour_test(i=);
   %local this_vital this_head;
   %let this_vital=%scan(&vitals,&i,^);
   %let this_head=%qscan(&Headers,&i,^);

   data _one_vital_discrete;
      length Abbreviation $30 source $5 TransfusionID_char $50;
      set HPCWORK.rbc_long;
      where Abbreviation="&this_vital";
      source='REAL';
      Hour=int((TimeFromTransfusion + 30)/60);
      if Hour<-4 then Hour=-4;
      if Hour>4 then Hour=4;
   run;

   ods select none;
   ods output CovParms=_cvp FitStatistics=_fitd LSMeans=_lsm Diffs=_diffs;

   proc hpmixed data=_one_vital_discrete;
      class PatientID TransfusionID_char PatientSex Hour;
      model Value=Hour RBC_Count PatientSex / solution;
      random intercept / subject=PatientID;
      lsmeans Hour / diff cl;
   run;
   ods select all;

   title1 "Discrete Hour Model => &this_head";

   proc print data=_cvp noobs label;
      var CovParm Subject Estimate;
      title2 "Random Effects => CovParms";
   run;

   proc print data=_fitd noobs label;
      title2 "Fit Statistics => Discrete Hour HPC => &this_head";
   run;

   title2 "LSMeans for Hour => &this_head";

   proc print data=_lsm noobs label;
      var Hour Estimate StdErr Lower Upper;
   run;

   title2 "Pairwise Differences of Hour => &this_head";

   proc print data=_diffs noobs label;
      var Hour _Hour Estimate StdErr Probt Lower Upper;
   run;
   title2;

   proc datasets lib=work nolist nowarn;
      delete _one_vital_discrete _lsm _diffs _cvp _fitd;
   quit;
%mend discrete_hour_test;

/*==========================================================================*/
/*  SECTION 5: EXECUTE ANALYSIS FOR ALL VITAL SIGNS                         */

/*==========================================================================*/
%macro run_all_vitals;
   %local i;
   %do i=1 %to &n_vitals;
      %analyze_vital(i=&i);
      %discrete_hour_test(i=&i);
   %end;
%mend run_all_vitals;

/* Run analyses */
%run_all_vitals;

/*==========================================================================*/
/*  SECTION 6: MULTI-PANEL STANDARDIZED (Z-SCORE) VISUALIZATION             */
/*==========================================================================*/

/*  Step 1: Sort for LOESS */
proc sort data=HPCWORK.rbc_long_z out=HPCWORK.z_sorted;
   by Abbreviation TimeFromTransfusion;
run;

/*  Step 2: Summarize z-scores */
proc means data=HPCWORK.z_sorted noprint;
   by Abbreviation TimeFromTransfusion;
   var Value_Z;
   output out=HPCWORK.z_means mean=Z_Mean;
run;

/*  Step 3: Restrict range */
data HPCWORK.z_means;
   set HPCWORK.z_means;
   if TimeFromTransfusion>=&min_time and TimeFromTransfusion<=&max_time;
run;

/*  Step 4: Add metadata */
data HPCWORK.z_means;
   set HPCWORK.z_means;
   length VitalName $50;
   if Abbreviation="ARTm" then do;
      VitalName="Mean Arterial Pressure (mmHg)";
      PlotOrder=1;
   end;
   else if Abbreviation="ARTs" then do;
      VitalName="Systolic Blood Pressure (mmHg)";
      PlotOrder=2;
   end;
   else if Abbreviation="ARTd" then do;
      VitalName="Diastolic Blood Pressure (mmHg)";
      PlotOrder=3;
   end;
   else if Abbreviation="Hjärtfrekv" then do;
      VitalName="Heart Rate (bpm)";
      PlotOrder=4;
   end;
   else if Abbreviation="FIO2(u)" then do;
      VitalName="Fraction of Inspired Oxygen (%)";
      PlotOrder=5;
   end;
   else if Abbreviation="SpO2" then do;
      VitalName="Peripheral Capillary Oxygen Saturation (%)";
      PlotOrder=6;
   end;
   else if Abbreviation="VE(u)" then do;
      VitalName="Minute Ventilation (L/min)";
      PlotOrder=7;
   end;
run;

/*  Step 5: Sort by PlotOrder for SGPANEL (not for LOESS) */
proc sort data=HPCWORK.z_means;
   by PlotOrder TimeFromTransfusion;
run;

/*  Step 6: Subsample for memory constraints */
%let max_loess_records=50000;

proc sql noprint;
   select count(*) into :total_count from HPCWORK.z_means;
quit;
%let fraction=%sysevalf(&max_loess_records / &total_count);

data HPCWORK.z_means_sample;
   set HPCWORK.z_means;
   if &total_count>&max_loess_records then do;
      if ranuni(1234)<&fraction then output;
   end;
   else output;
run;

/* Sort for SGPANEL usage by PlotOrder, but LOESS needs Abbreviation sorting */
proc sort data=HPCWORK.z_means_sample;
   by PlotOrder TimeFromTransfusion;
run;

/* Further thinning every 3rd row */
data HPCWORK.z_means_sample;
   set HPCWORK.z_means_sample;
   by PlotOrder TimeFromTransfusion;
   if first.PlotOrder then counter=0;
   counter+1;
   if mod(counter,3)=0 then output;
   drop counter;
run;

proc sort data=HPCWORK.z_means_sample;
   by PlotOrder TimeFromTransfusion;
run;

/* Create a separate dataset for LOESS, sorted by Abbreviation */
data HPCWORK.z_for_loess;
   set HPCWORK.z_means_sample;
run;

proc sort data=HPCWORK.z_for_loess;
   by Abbreviation TimeFromTransfusion;
run;

/*--- Main LOESS with smoothing=0.3 ---*/
proc loess data=HPCWORK.z_for_loess;
   by Abbreviation;
   model Z_Mean=TimeFromTransfusion / smooth=0.3 degree=2 alpha=0.05 direct all;
   output out=HPCWORK.loess_smoothed p=Pred lclm=LCL uclm=UCL;
run;

/* Add display metadata + placeholders for newly introduced columns below */
data HPCWORK.loess_smoothed;
   set HPCWORK.loess_smoothed;
   length VitalName $50;
   if Abbreviation="ARTm" then do;
      VitalName="Mean Arterial Pressure (mmHg)";
      PlotOrder=1;
   end;
   else if Abbreviation="ARTs" then do;
      VitalName="Systolic Blood Pressure (mmHg)";
      PlotOrder=2;
   end;
   else if Abbreviation="ARTd" then do;
      VitalName="Diastolic Blood Pressure (mmHg)";
      PlotOrder=3;
   end;
   else if Abbreviation="Hjärtfrekv" then do;
      VitalName="Heart Rate (bpm)";
      PlotOrder=4;
   end;
   else if Abbreviation="FIO2(u)" then do;
      VitalName="Fraction of Inspired Oxygen (%)";
      PlotOrder=5;
   end;
   else if Abbreviation="SpO2" then do;
      VitalName="Peripheral Capillary Oxygen Saturation (%)";
      PlotOrder=6;
   end;
   else if Abbreviation="VE(u)" then do;
      VitalName="Minute Ventilation (L/min)";
      PlotOrder=7;
   end;
run;

/*======================================================================*/
/*  6.1: ADDITIONAL LOESS CALCULATIONS FOR A RANGE OF SMOOTHING FACTORS */

/*======================================================================*/
%macro build_loess_range(min, max, step);
   %global loess_range;
   %let loess_range=;
   %do s=&min %to &max %by &step;
      %let loess_range=&loess_range &s;
   %end;
%mend;
%build_loess_range(&LOESS_min,&LOESS_max,&LOESS_step);

%macro build_loess_columns;
   %global loess_cols;
   %let loess_cols=;
   %let count=%sysfunc(countw(&loess_range));
   %do i=1 %to &count;
      %let s=%scan(&loess_range,&i);
      %let loess_cols=&loess_cols Pred_&s LCL_&s UCL_&s;
   %end;
%mend build_loess_columns;
%build_loess_columns;

ods select none;

%macro multi_loess;
   %local i s sdec count;
   %let count=%sysfunc(countw(&loess_range));

   %do i=1 %to &count;
      %let s=%scan(&loess_range,&i);
      %let sdec=%sysevalf(&s/100);

      proc loess data=HPCWORK.z_for_loess;
         by Abbreviation;
         model Z_Mean=TimeFromTransfusion / smooth=&sdec degree=2 alpha=0.05
            direct all;
         output out=HPCWORK.loess_s&s p=Pred lclm=LCL uclm=UCL;
      run;

      data HPCWORK.loess_s&s;
         set HPCWORK.loess_s&s;
         rename Pred=Pred_&s LCL=LCL_&s UCL=UCL_&s;
      run;

      proc sort data=HPCWORK.loess_s&s;
         by Abbreviation TimeFromTransfusion;
      run;

      proc sort data=HPCWORK.loess_smoothed;
         by Abbreviation TimeFromTransfusion;
      run;

      data HPCWORK.loess_smoothed;
         merge HPCWORK.loess_smoothed(in=a) HPCWORK.loess_s&s(in=b);
         by Abbreviation TimeFromTransfusion;
         if a;
      run;

      proc datasets lib=work nolist;
         delete loess_s&s;
      quit;
   %end;
%mend multi_loess;
%multi_loess;
ods select all;

/* Step 8: SGPANEL with only smoothing=0.3 */
ods graphics on / reset width=11in height=8.5in loessmaxobs=250000 imagefmt=png
   antialiasmax=10000;
options orientation=landscape;

title1 "Multi-Panel LOESS: Z-Score Plots for All Vital Parameters";

proc sgpanel data=HPCWORK.z_means_sample;
   where PlotOrder <= 7;
   panelby VitalName / columns=3 rows=3 novarname sort=data;
   loess x=TimeFromTransfusion y=Z_Mean / nomarkers smooth=0.3 maxpoints=20000
      lineattrs=(thickness=2 color=blue);
   refline 0 / axis=x lineattrs=(color=red pattern=2) label="Transfusion=0";
   colaxis label="Time from Transfusion (min)" values=(&timeTicks);
   rowaxis label="Z-Score" min=-0.3 max=0.3;
run;
title1;

/* Add columns to avoid "uninitialized" error for LOESS dataset */
data HPCWORK.loess_smoothed;
   set HPCWORK.loess_smoothed;
   length CompFactor $30 CompName $50 YLabel $100 DeltaYLabel $100;
   CompFactor='LOESS';
   CompName='Z-Score Comparison';
   YLabel='Z-Score';
   DeltaYLabel='Z-Score';
run;

/* Write HPCWORK.loess_smoothed to viz.viz_LOESS */
data viz.viz_LOESS;
   retain Abbreviation TimeFromTransfusion Z_Mean VitalName PlotOrder Pred LCL
      UCL VitalParam &loess_cols CompFactor CompName YLabel DeltaYLabel;
   set HPCWORK.loess_smoothed;

   length VitalParam $30;
   if Abbreviation="ARTm" then VitalParam="ARTm";
   else if Abbreviation="ARTs" then VitalParam="ARTs";
   else if Abbreviation="ARTd" then VitalParam="ARTd";
   else if Abbreviation="Hjärtfrekv" then VitalParam="HR";
   else if Abbreviation="FIO2(u)" then VitalParam="FIO2";
   else if Abbreviation="SpO2" then VitalParam="SpO2";
   else if Abbreviation="VE(u)" then VitalParam="VE";
run;

/* Add LOESS to index */
proc sql;
   insert into viz.viz_index select distinct a.VitalParam, 'LOESS' as
      CompFactor, 'Z-Score Comparison' as CompName, a.VitalName, 'Z-Score' as
      YLabel, 'Z-Score' as DeltaYLabel from viz.viz_LOESS as a;
quit;

/* Reset orientation */
options orientation=portrait;
ods graphics off;

/*==========================================================================*/
/*  SECTION 7: RESULTS TABLES                                               */
/*==========================================================================*/
title "Table 1: Observed Data Summary (Interval = &interval_minutes minutes)";

proc print data=HPCWORK.table1 noobs label;
   var Abbreviation Pre_Mean Pre_SD Post_Mean Post_SD Diff_Mean Diff_LCL
      Diff_UCL;
   label Pre_Mean="Pre-Transfusion Mean" Pre_SD="Pre-Transfusion SD"
      Post_Mean="Post-Transfusion Mean" Post_SD="Post-Transfusion SD"
      Diff_Mean="Mean Difference" Diff_LCL="95% CI Lower"
      Diff_UCL="95% CI Upper";
run;

title "Table 2: Model-Based Summary (Interval = &interval_minutes minutes)";
title2 "CORRECTED: CIs now computed using change model with proper inference";

proc print data=HPCWORK.table2 noobs label;
   var Abbreviation Base_Pre Full_Pre Base_Post Full_Post Base_Diff Base_Diff_SE
      Base_Diff_LCL Base_Diff_UCL Full_Diff Full_Diff_SE Full_Diff_LCL
      Full_Diff_UCL;
   label Base_Pre="Base Pre-Transfusion"
      Full_Pre="Fully Adjusted Pre-Transfusion"
      Base_Post="Base Post-Transfusion"
      Full_Post="Fully Adjusted Post-Transfusion"
      Base_Diff="Base Mean Difference" Base_Diff_SE="Base Std Error"
      Base_Diff_LCL="Base 95% CI Lower" Base_Diff_UCL="Base 95% CI Upper"
      Full_Diff="Fully Adjusted Mean Difference"
      Full_Diff_SE="Fully Adjusted Std Error"
      Full_Diff_LCL="Fully Adjusted 95% CI Lower"
      Full_Diff_UCL="Fully Adjusted 95% CI Upper";
run;
title;
title2;

/* Enforce column order for model-based summary */
data HPCWORK.table2_ordered;
   retain Abbreviation Base_Pre Base_Post Base_Diff Base_Diff_SE Base_Diff_LCL
      Base_Diff_UCL Full_Pre Full_Post Full_Diff Full_Diff_SE Full_Diff_LCL
      Full_Diff_UCL;
   set HPCWORK.table2;
run;

/* Export CSV files */
%let csv_path=<PROJECT_ROOT>\analysis\script_data;
options dlcreatedir;
libname CSVOUT "&csv_path";
libname CSVOUT clear;

%macro export_datasets_to_csv;
   data _null_;
      file "&csv_path\transfusion_viz_index.csv";
      put "VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel";
   run;

   proc sql noprint;
      select memname into :dslist separated by ' ' from dictionary.tables where
         libname='VIZ' and memname ne 'VIZ_INDEX';
   quit;

   %let num_ds=%sysfunc(countw(&dslist));
   %do i=1 %to &num_ds;
      %let dsname=%scan(&dslist,&i);

      proc export data=viz.&dsname outfile="&csv_path\&dsname..csv" dbms=csv
         replace;
      run;

      data _null_;
         set viz.&dsname(obs=1);
         file "&csv_path\transfusion_viz_index.csv" mod;
         put VitalParam "," CompFactor "," CompName "," VitalName "," YLabel ","
            DeltaYLabel;
      run;
   %end;
%mend;

%export_datasets_to_csv;

/* Export Table 1 */
proc export data=HPCWORK.table1 outfile="&csv_path\observed_data_summary.csv"
   dbms=csv replace;
run;

/* Export Table 2 (Ordered) */
proc export data=HPCWORK.table2_ordered
   outfile="&csv_path\model_based_summary.csv" dbms=csv replace;
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
