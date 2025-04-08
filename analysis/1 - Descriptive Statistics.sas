/******************************************************************************************/
/* Descriptive Statistics.sas (1 of 3 scripts)                                            */                                          
/*                                                                                        */
/* This code:                                                                             */
/* - Processes the full dataset                                                           */
/* - Computes descriptive statistics for transfused patients and RBC component            */
/* - Outputs tables to SAS Results Viewer                                                 */
/* - Generates CSV files for downstream visualization in the dashboard                    */
/*                                                                                        */
/* Author: SCANDAT Research Group, Lucas D. Ekstrom                                       */
/* Last modified: March 2025                                                              */
/*                                                                                        */
/* Note: Before running this script:                                                      */
/*   1. Update the %LET project_root = /path/to/project/root; statement at the beginning  */
/*   2. Update the %LET dataset_name = transfusion_data; to your actual dataset name      */
/*   3. Ensure the following directory structure exists:                                  */
/*      - &project_root./data (containing your dataset)                                   */
/*      - &project_root./output/csv (for exported CSV files)                              */
/******************************************************************************************/

/* Setup environment */
OPTIONS NODATE NONUMBER;

/* Path configuration - MODIFY THESE BEFORE RUNNING, SEE INSTRUCTIONS ABOVE */
%LET project_root = /path/to/project/root; /* Edit this to your project location */
LIBNAME mydata "&project_root";
/* CSV output directory */
%LET csv_outpath = /path/to/csv/output;/* Edit this to your csv output location */
/* Dataset name */
%LET dataset_name = transfusion_data; /* Replace with your actual dataset name */

/***************************************************************************/
/* Data import and preparation                                             */
/***************************************************************************/
DATA work.transvital_raw;
    SET mydata.&dataset_name;
RUN;

DATA work.transvital_raw;
    SET work.transvital_raw;
    TransfusionID = CATX('_', PatientID, PUT(TransDt, E8601DT19.),
                         Poolnum, UnitNumber, ComponentType);
RUN;

/***************************************************************************/
/* Collapsing to unique TransfusionID                                      */
/* Using FIRST./LAST. variables to handle duplicates                       */
/***************************************************************************/
PROC SORT DATA=work.transvital_raw OUT=transvital_sorted;
    BY TransfusionID;
RUN;

DATA work.transfusions;
    SET transvital_sorted;
    BY TransfusionID;
    RETAIN DonorHb_storage DonorSex_storage DonorParity_storage Storage_storage;

    IF FIRST.TransfusionID THEN DO;
        DonorHb_storage     = .;
        DonorSex_storage    = .;
        DonorParity_storage = .;
        Storage_storage     = .;
    END;

    IF MISSING(DonorHb_storage)   AND NOT MISSING(DonorHb)   THEN DonorHb_storage   = DonorHb;
    IF MISSING(DonorSex_storage)  AND NOT MISSING(DonorSex)  THEN DonorSex_storage  = DonorSex;
    IF MISSING(DonorParity_storage) AND NOT MISSING(DonorParity) THEN DonorParity_storage = DonorParity;
    IF MISSING(Storage_storage)   AND NOT MISSING(Storage)   THEN Storage_storage   = Storage;

    IF LAST.TransfusionID THEN DO;
        DonorHb     = DonorHb_storage;
        DonorSex    = DonorSex_storage;
        DonorParity = DonorParity_storage;
        Storage     = Storage_storage;
        OUTPUT;
    END;

    KEEP TransfusionID PatientID DonorHb DonorSex DonorParity Storage
         TransDt Datetime Age Sex admissiontime dischargetime
         wdy_donation DiagnosisCodeName_1;
RUN;

/***************************************************************************/
/* Variable categorization for analysis                                    */
/* Creating clinically relevant groupings                                  */
/***************************************************************************/
DATA work.transfusions;
    SET work.transfusions;
    LENGTH donorhb_category $7 storagecat $7 donor_sex_label $1 donor_parity_label $10;

    /* Donor Hb in g/L */
    IF DonorHb < 125 THEN donorhb_category = "<125";
    ELSE IF 125 <= DonorHb < 140 THEN donorhb_category = "125-139";
    ELSE IF 140 <= DonorHb < 155 THEN donorhb_category = "140-154";
    ELSE IF 155 <= DonorHb < 170 THEN donorhb_category = "155-169";
    ELSE IF DonorHb >= 170 THEN donorhb_category = ">=170";
    ELSE donorhb_category = "Unknown";

    /* Storage duration in days */
    IF Storage < 10 THEN storagecat = "<10";
    ELSE IF 10 <= Storage < 20 THEN storagecat = "10-19";
    ELSE IF 20 <= Storage < 30 THEN storagecat = "20-29";
    ELSE IF 30 <= Storage < 40 THEN storagecat = "30-39";
    ELSE IF Storage >= 40 THEN storagecat = ">=40";
    ELSE storagecat = "Unknown";

    /* Donor Sex coding */
    IF DonorSex = 1 THEN donor_sex_label = "M";
    ELSE IF DonorSex = 2 THEN donor_sex_label = "F";
    ELSE donor_sex_label = "U";

    /* Donor Parity */
    IF MISSING(DonorParity) THEN donor_parity_label = "Unknown";
    ELSE donor_parity_label = STRIP(PUT(DonorParity, BEST12.));

    /* Retain all variables */
    KEEP TransfusionID PatientID DonorHb DonorSex DonorParity Storage
         TransDt Datetime Age Sex admissiontime dischargetime
         wdy_donation DiagnosisCodeName_1
         donorhb_category storagecat donor_sex_label donor_parity_label;
RUN;

/***************************************************************************/
/*                 PART A: PATIENT-LEVEL ANALYSIS                          */
/***************************************************************************/
TITLE "DESCRIPTIVE STATS: Patient Characteristics";

/* Count unique patients */
PROC SQL;
    CREATE TABLE unique_patients_count AS
    SELECT COUNT(DISTINCT PatientID) AS No_of_Unique_Patients
    FROM work.transfusions;
QUIT;

/* Display results */
PROC PRINT DATA=unique_patients_count NOOBS;
    TITLE2 "Number of Unique Patients";
RUN;

/* Export to CSV */
PROC EXPORT DATA=unique_patients_count
    OUTFILE="&csv_outpath\unique_patients_count.csv"
    DBMS=CSV REPLACE;
RUN;

/* Patient sex distribution */
PROC SQL;
    CREATE TABLE patient_sex_distribution AS
    SELECT Sex AS Patient_Sex,
           COUNT(DISTINCT PatientID) AS No_of_Patients
    FROM work.transvital_raw
    GROUP BY Sex;
QUIT;

/* Display results */
PROC PRINT DATA=patient_sex_distribution NOOBS;
    TITLE2 "Distribution of Patients by Sex";
    VAR Patient_Sex No_of_Patients;
RUN;

/* Export to CSV */
PROC EXPORT DATA=patient_sex_distribution
    OUTFILE="&csv_outpath\patient_sex_distribution.csv"
    DBMS=CSV REPLACE;
RUN;

/* Patient age statistics */
PROC SQL;
    CREATE TABLE unique_patients_age AS
    SELECT DISTINCT PatientID, Age
    FROM work.transvital_raw;
QUIT;

PROC MEANS DATA=unique_patients_age;
    VAR Age;
    OUTPUT OUT=age_stats
        MEAN=Mean_Age
        MEDIAN=Median_Age
        MIN=Min_Age
        MAX=Max_Age
        Q1=Q1_Age
        Q3=Q3_Age;
RUN;

/* Display results */
PROC PRINT DATA=age_stats NOOBS;
    TITLE2 "Summary Statistics of Patient Age";
    VAR Mean_Age Median_Age Q1_Age Q3_Age Min_Age Max_Age;
RUN;

/* Export to CSV */
PROC EXPORT DATA=age_stats
    OUTFILE="&csv_outpath\patient_age_stats.csv"
    DBMS=CSV REPLACE;
RUN;

/* Age group distribution */
DATA unique_patients_age_cat;
    SET unique_patients_age;
    IF Age < 20 THEN Age_Group = "<20";
    ELSE IF 20 <= Age < 30 THEN Age_Group = "20-29";
    ELSE IF 30 <= Age < 40 THEN Age_Group = "30-39";
    ELSE IF 40 <= Age < 50 THEN Age_Group = "40-49";
    ELSE IF 50 <= Age < 60 THEN Age_Group = "50-59";
    ELSE IF 60 <= Age < 70 THEN Age_Group = "60-69";
    ELSE IF 70 <= Age < 80 THEN Age_Group = "70-79";
    ELSE IF Age >= 80 THEN Age_Group = "80+";
    ELSE Age_Group = "Unknown";
RUN;

/* Display results */
PROC FREQ DATA=unique_patients_age_cat;
    TABLE Age_Group;
    TITLE2 "Distribution of Patients by Age Group";
RUN;

/* Create counts table */
PROC FREQ DATA=unique_patients_age_cat NOPRINT;
    TABLE Age_Group / OUT=age_group_counts NOCUM;
RUN;

/* Export to CSV */
PROC EXPORT DATA=age_group_counts
    OUTFILE="&csv_outpath\patient_age_groups.csv"
    DBMS=CSV REPLACE;
RUN;

/***************************************************************************/
/*                 PART B: TRANSFUSION INTENSITY ANALYSIS                  */
/***************************************************************************/
/* RBC units per patient */
PROC SQL;
    CREATE TABLE patients_units AS
    SELECT PatientID, COUNT(TransfusionID) AS No_of_Units
    FROM work.transfusions
    GROUP BY PatientID;
QUIT;

/* Categorize by unit count */
DATA patients_unit_categories;
    SET patients_units;
    LENGTH Unit_Category $10;

    IF No_of_Units = 1 THEN Unit_Category = "1 unit";
    ELSE IF No_of_Units = 2 THEN Unit_Category = "2 units";
    ELSE IF No_of_Units = 3 THEN Unit_Category = "3 units";
    ELSE IF No_of_Units = 4 THEN Unit_Category = "4 units";
    ELSE IF No_of_Units = 5 THEN Unit_Category = "5 units";
    ELSE IF No_of_Units = 6 THEN Unit_Category = "6 units";
    ELSE IF No_of_Units = 7 THEN Unit_Category = "7 units";
    ELSE IF No_of_Units = 8 THEN Unit_Category = "8 units";
    ELSE IF No_of_Units = 9 THEN Unit_Category = "9 units";
    ELSE IF No_of_Units >= 10 THEN Unit_Category = ">9 units";
RUN;

/* Calculate frequencies */
PROC FREQ DATA=patients_unit_categories NOPRINT;
    TABLE Unit_Category / OUT=units_freq (DROP=PERCENT);
RUN;

/* Get total for relative frequency */
PROC SQL NOPRINT;
    SELECT COUNT(DISTINCT PatientID) INTO :total_pt
    FROM patients_unit_categories;
QUIT;

DATA units_freq;
    SET units_freq;
    Relative_Frequency = (COUNT / &total_pt)*100;
RUN;

/* Display results */
PROC PRINT DATA=units_freq NOOBS;
    TITLE "Distribution of RBC Units Received per Patient";
    VAR Unit_Category COUNT Relative_Frequency;
    FORMAT Relative_Frequency 5.1;
RUN;

/* Export to CSV */
PROC EXPORT DATA=units_freq
    OUTFILE="&csv_outpath\rbc_units_per_patient.csv"
    DBMS=CSV REPLACE;
RUN;

/* Show total patients */
PROC SQL;
    SELECT COUNT(DISTINCT PatientID) AS Unique_patients
    FROM patients_unit_categories;
QUIT;

/***************************************************************************/
/*                 PART C: BLOOD COMPONENT CHARACTERISTICS                 */
/***************************************************************************/
TITLE "BLOOD COMPONENTS & DONOR CHARACTERISTICS";

/* Total units count */
PROC SQL;
    CREATE TABLE total_transfused_units AS
    SELECT COUNT(*) AS No_of_Transfused_Units
    FROM work.transfusions;
QUIT;

/* Display results */
PROC PRINT DATA=total_transfused_units NOOBS;
    TITLE2 "Total Number of Transfused Units";
RUN;

/* Export to CSV */
PROC EXPORT DATA=total_transfused_units
    OUTFILE="&csv_outpath\total_transfused_units.csv"
    DBMS=CSV REPLACE;
RUN;

/* Donor Hb distribution */
PROC SQL;
    CREATE TABLE donorhb_distribution AS
    SELECT donorhb_category, COUNT(*) AS No_of_Transfused_Units
    FROM work.transfusions
    GROUP BY donorhb_category;
QUIT;

/* Display results */
PROC PRINT DATA=donorhb_distribution NOOBS;
    TITLE2 "Distribution of Transfused Units by Donor Hb Category";
RUN;

/* Export to CSV */
PROC EXPORT DATA=donorhb_distribution
    OUTFILE="&csv_outpath\donorhb_distribution.csv"
    DBMS=CSV REPLACE;
RUN;

/* Storage time distribution */
PROC SQL;
    CREATE TABLE storage_distribution AS
    SELECT storagecat, COUNT(*) AS No_of_Transfused_Units
    FROM work.transfusions
    GROUP BY storagecat;
QUIT;

/* Display results */
PROC PRINT DATA=storage_distribution NOOBS;
    TITLE2 "Distribution of Transfused Units by Storage Time Category";
RUN;

/* Export to CSV */
PROC EXPORT DATA=storage_distribution
    OUTFILE="&csv_outpath\storage_distribution.csv"
    DBMS=CSV REPLACE;
RUN;

/* Donor sex distribution */
PROC SQL;
    CREATE TABLE sex_distribution AS
    SELECT donor_sex_label, COUNT(*) AS No_of_Transfused_Units
    FROM work.transfusions
    GROUP BY donor_sex_label;
QUIT;

/* Display results */
PROC PRINT DATA=sex_distribution NOOBS;
    TITLE2 "Distribution of Transfused Units by Donor Sex";
RUN;

/* Export to CSV */
PROC EXPORT DATA=sex_distribution
    OUTFILE="&csv_outpath\donor_sex_distribution.csv"
    DBMS=CSV REPLACE;
RUN;

/* Donor parity distribution */
PROC SQL;
    CREATE TABLE donorparity_distribution AS
    SELECT donor_parity_label, COUNT(*) AS No_of_Transfused_Units
    FROM work.transfusions
    GROUP BY donor_parity_label;
QUIT;

/* Display results */
PROC PRINT DATA=donorparity_distribution NOOBS;
    TITLE2 "Distribution of Transfused Units by Donor Parity";
RUN;

/* Export to CSV */
PROC EXPORT DATA=donorparity_distribution
    OUTFILE="&csv_outpath\donor_parity_distribution.csv"
    DBMS=CSV REPLACE;
RUN;

/* Donation weekday distribution */
PROC SQL;
    CREATE TABLE wdy_distribution AS
    SELECT wdy_donation, COUNT(*) AS No_of_Transfused_Units
    FROM work.transfusions
    GROUP BY wdy_donation;
QUIT;

/* Display results */
PROC PRINT DATA=wdy_distribution NOOBS;
    TITLE2 "Distribution of Transfused Units by Donation Weekday";
RUN;

/* Export to CSV */
PROC EXPORT DATA=wdy_distribution
    OUTFILE="&csv_outpath\donation_weekday_distribution.csv"
    DBMS=CSV REPLACE;
RUN;

/***************************************************************************/
/* Visualization with SGPLOT                                               */
/* Creating standard bar charts for key distributions                      */
/***************************************************************************/
ODS GRAPHICS ON;

/* Age Groups chart */
PROC SGPLOT DATA=unique_patients_age_cat;
    VBAR Age_Group;
    TITLE "Bar Chart of Age Groups";
    XAXIS DISCRETEORDER=DATA;
RUN;

/* RBC Units per Patient */
PROC SGPLOT DATA=units_freq;
    VBAR Unit_Category / RESPONSE=COUNT DATALABEL;
    TITLE "Bar Chart: Number of RBC Units Received per Patient";
    XAXIS DISCRETEORDER=DATA;
    YAXIS LABEL="Patient Count";
RUN;

/* Donor Hb Distribution */
PROC SGPLOT DATA=donorhb_distribution;
    VBAR donorhb_category / RESPONSE=No_of_Transfused_Units DATALABEL;
    TITLE "Bar Chart: Donor Hb Category Distribution";
    XAXIS DISCRETEORDER=DATA;
    YAXIS LABEL="Number of Transfused Units";
RUN;

/* Storage Time Distribution */
PROC SGPLOT DATA=storage_distribution;
    VBAR storagecat / RESPONSE=No_of_Transfused_Units DATALABEL;
    TITLE "Bar Chart: Storage Time Category Distribution";
    XAXIS DISCRETEORDER=DATA;
    YAXIS LABEL="Number of Transfused Units";
RUN;

/* Donor Sex Distribution */
PROC SGPLOT DATA=sex_distribution;
    VBAR donor_sex_label / RESPONSE=No_of_Transfused_Units DATALABEL;
    TITLE "Bar Chart: Donor Sex Distribution";
    XAXIS DISCRETEORDER=DATA;
    YAXIS LABEL="Number of Transfused Units";
RUN;

/* Donor Parity Distribution */
PROC SGPLOT DATA=donorparity_distribution;
    VBAR donor_parity_label / RESPONSE=No_of_Transfused_Units DATALABEL;
    TITLE "Bar Chart: Donor Parity Distribution";
    XAXIS DISCRETEORDER=DATA;
    YAXIS LABEL="Number of Transfused Units";
RUN;

/* Weekday Distribution */
PROC SGPLOT DATA=wdy_distribution;
    VBAR wdy_donation / RESPONSE=No_of_Transfused_Units DATALABEL;
    TITLE "Bar Chart: Donation Weekday Distribution";
    XAXIS DISCRETEORDER=DATA;
    YAXIS LABEL="Number of Transfused Units";
RUN;

ODS GRAPHICS OFF;

/***************************************************************************/
/* End of DESCRIPTIVE_Stats.sas                                            */
/***************************************************************************/
TITLE; 
FOOTNOTE;

