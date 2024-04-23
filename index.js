("use strict");
const { log } = require('./logger');
const axios = require("axios").default;
const database = require('./sql/database')
const fs = require('node:fs')

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

	const sqlData = await database.getData()

	const cases = process.env.DEBUG ? await loadCaseData() : await getCaseData()

	for (const c of cases) {
		const newCase = unNestCase(c)
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
const compareRecords = (n, old) => {
	const changes = {}
	let changed = false
	for (prop in n) {
		if (old[prop] != n[prop]) {
			changes[prop] = n[prop]
			changed = true
		}
	}
	return changed ? changes : null
}
const loadCaseData = async () => {
	const data = JSON.parse(fs.readFileSync('files/data.txt', 'utf-8'))
	return data.data
}
const loginAcumaticaApi = async () => {
	const login = await axios.post(process.env.LOGIN_URI, {
		name: process.env.LOGIN_NAME,
		password: process.env.LOGIN_PW,
		company: process.env.LOGIN_COMPANY
	})
	if (process.env.DEBUG) {
		console.log("login")
	}

	return parseCookie(login)
}
const getCaseData = async () => {
	const loginCookie = await loginAcumaticaApi()
	const cases = await axios.put(process.env.CASES_URI, {}, {
		headers: {
			Cookie: loginCookie
		}
	})
	if (process.env.DEBUG) {
		console.log("cases")
	}

	if (process.env.DEBUG) {
		try {
			fs.writeFileSync('files/data.txt', JSON.stringify(cases.data))
		} catch (err) { }
	}
	return cases.data.CasesRTTDetails
}

const unNestCase = (c) => {
	const newCase = unNestObject(c)
	newCase.acumatica_id = newCase.id
	delete newCase.id
	return newCase
}
const unNestObject = (c) => {
	const newObject = {}
	for (prop in c) {
		newObject[prop] = null
		if (c[prop] != null) {
			if (Object.keys(c[prop]).length != 0) {
				newObject[prop] = c[prop].hasOwnProperty('value') ? c[prop].value : c[prop]
			}
		}
	}
	return newObject
}

const parseCookie = (response) => {
	const cookie = response.headers['set-cookie'].join(" ");

	return [
		cookie.match(/.ASPXAUTH=\w+/)[0],
		//cookie.match(/ASP.NET_SessionId=\w+/)[0],
		//cookie.match(/requestid=\w+/)[0],
		//cookie.match(/requeststat=\+st:\w+\+sc:~(\/\w+)+\+start:\w+\+tg:/)[0]
	].join("; ")
}

on_boot();