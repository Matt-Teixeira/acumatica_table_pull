("use strict");
const { log } = require('./logger');
const database = require('./sql/database')
const util = require('./utils/util')

const on_boot = async () => {
	//try {
	//  // TYPE (info, warn, error), JOBID (NA FOR NOW), SME (NA FOR NOW), FN NAME, FN EVENT, {k/v}s
	//  await log("info", "NA", "NA", "on_boot", `FN CALL`);
	//
	//  run_job();
	//} catch (error) {
	//  console.log(error);
	//  await log("error", "NA", "NA", "on_boot", `FN CALL`, {
	//    error,
	//  });
	//}

	const sqlData = await database.getCaseData()

	const cases = process.env.DEBUG ? await util.loadCaseData() : await util.getCaseData()

	for (const c of cases) {
		const newCase = util.unNestCase(c)
		const found = sqlData.find(e => e.acumatica_id == newCase.acumatica_id)
		if (found == null) {
			console.log(`Inserting new record with ID: ${newCase.acumatica_id}`)
			await database.insertCase(newCase)
		} else {
			const changes = compareRecords(newCase, found)
			if (changes != null) {
				console.log(`Updating record with ID: ${newCase.acumatica_id}`)
				await database.updateCase(newCase.acumatica_id, changes)
			} else {
				console.log(`No changes for ID: ${newCase.acumatica_id}`)
			}
		}
	}
}

on_boot();