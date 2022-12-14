-- This script was generated by a beta version of the ERD tool in pgAdmin 4.
-- Please log an issue at https://redmine.postgresql.org/projects/pgadmin4/issues/new if you find any bugs, including reproduction steps.
BEGIN;


CREATE TABLE IF NOT EXISTS public.feedback
(
    report_id character varying NOT NULL,
    version character varying,
    org_name character varying NOT NULL,
    email character varying NOT NULL,
    date_range_begin bigint NOT NULL,
    date_range_end bigint NOT NULL,
    domain character varying NOT NULL,
    adkim character varying NOT NULL,
    aspf character varying NOT NULL,
    p character varying NOT NULL,
    sp character varying,
    percent character varying NOT NULL,
    fo character varying,
    ri bigint,
    extra_contact_info character varying,
    count bigint NOT NULL,
    disposition character varying NOT NULL,
    dkim character varying NOT NULL,
    spf character varying NOT NULL,
    envelope_to character varying,
    header_from character varying,
    envelope_from character varying,
    res_dkim_domain character varying,
    res_dkim_result character varying,
    res_dkim_human_result character varying,
    res_dkim_selector character varying,
    res_spf_domain character varying NOT NULL,
    res_spf_result character varying NOT NULL,
    res_spf_scope character varying,
    PRIMARY KEY (report_id, org_name)
);

CREATE TABLE IF NOT EXISTS public.errors
(
    report_id character varying NOT NULL,
    org_name character varying NOT NULL,
    error character varying NOT NULL,
    PRIMARY KEY (report_id, org_name, error)
);

ALTER TABLE IF EXISTS public.errors
    ADD FOREIGN KEY (report_id, org_name)
    REFERENCES public.feedback (report_id, org_name) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

END;