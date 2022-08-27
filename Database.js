import pg from 'pg';

export default class Database {
	#client = null;

	constructor(credentials) {
		this.#client = new pg.Client(credentials);
		this.#client.connect();
	}

	async selectAll() {
		const res = await this.#client.query(`
			SELECT * FROM feedback
		`);

		return res.rows;
	}

	async insertData(data, path) {
		let ar_dkim = data.feedback.record[0].auth_results[0].dkim;
		if(ar_dkim) {
			ar_dkim = ar_dkim[0];
		} else {
			ar_dkim = {
				domain: [null],
				result: [null],
			}
		}

		try {
			await this.#client.query(`
				INSERT INTO public.feedback(
					report_id, version, org_name, email, date_range_begin, date_range_end, domain, adkim, aspf, p, sp, percent, fo, ri,
					extra_contact_info, count, disposition, dkim, spf, envelope_to, header_from, envelope_from, res_dkim_domain,
					res_dkim_result, res_dkim_human_result, res_dkim_selector, res_spf_domain, res_spf_result, res_spf_scope
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29);
			`, [
				data.feedback.report_metadata[0].report_id[0], // report_id
				data.version || null, // version
				data.feedback.report_metadata[0].org_name[0], // org_name
				data.feedback.report_metadata[0].email[0], // email
				data.feedback.report_metadata[0].date_range[0].begin[0], // date_range_begin
				data.feedback.report_metadata[0].date_range[0].end[0], // date_range_end
				data.feedback.policy_published[0].domain[0], // domain
				data.feedback.policy_published[0].adkim[0], // adkim
				data.feedback.policy_published[0].aspf[0], // aspf
				data.feedback.policy_published[0].p[0], // p
				data.feedback.policy_published[0].sp ? data.feedback.policy_published[0].sp[0] : null, // sp
				data.feedback.policy_published[0].pct[0], // percent
				data.feedback.policy_published[0].fo ? data.feedback.policy_published[0].fo[0] : null, // fo
				data.feedback.policy_published[0].ri ? data.feedback.policy_published[0].ri[0] : null, // ri
				data.feedback.report_metadata[0].extra_contact_info ? data.feedback.report_metadata[0].extra_contact_info[0] : null, // extra_contact_info
				data.feedback.record[0].row[0].count[0], // count
				data.feedback.record[0].row[0].policy_evaluated[0].disposition[0], // disposition
				data.feedback.record[0].row[0].policy_evaluated[0].dkim[0], // dkim
				data.feedback.record[0].row[0].policy_evaluated[0].spf[0], // spf
				data.feedback.record[0].identifiers[0].envelope_to ? data.feedback.record[0].identifiers[0].envelope_to[0] : null, // envelope_to
				data.feedback.record[0].identifiers[0].header_from ? data.feedback.record[0].identifiers[0].header_from[0] : null, // header_from
				data.feedback.record[0].identifiers[0].envelope_from ? data.feedback.record[0].identifiers[0].envelope_from[0] : null, // envelope_from
				ar_dkim.domain[0], // res_dkim_domain
				ar_dkim.result[0], // res_dkim_result
				ar_dkim.human_result ? ar_dkim.human_result[0] : null, // res_dkim_human_result
				ar_dkim.selector ? ar_dkim.selector[0] : null, // res_dkim_selector
				data.feedback.record[0].auth_results[0].spf[0].domain[0], // res_spf_domain
				data.feedback.record[0].auth_results[0].spf[0].result[0], // res_spf_result
				data.feedback.record[0].auth_results[0].spf[0].scope ? data.feedback.record[0].auth_results[0].spf[0].scope[0] : null, // res_spf_scope
			]);
		} catch(e) {
			console.log(path);
			console.log(JSON.stringify(data));
			console.error(e.name);
			console.error(e.message);
			console.error(e);
		}

		/*await this.#client.query(`
			INSERT INTO public.errors(
				report_id, org_name, error)
				VALUES (?, ?, ?);
		`);*/
	}
}