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

	//const req = await fetch(process.env.LOGIN_URI, {
	//	method: 'POST',
	//	credentials: 'include',
	//	headers: {
	//		'Content-Type': 'application/json',
	//	},
	//	body: JSON.stringify({
	//		name: process.env.LOGIN_NAME,
	//		password: process.env.LOGIN_PW,
	//		company: process.env.LOGIN_COMPANY
	//	})
	//})
	//console.log('login request completed')
	//
	//const req2 = await fetch(process.env.EQUIP_URI, {
	//	method: 'PUT',
	//	credentials: 'include',
	//	body: {
	//	}
	//})
	//console.log('Equipment request completed')

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

	//const keepAliveAgent1 = new https.Agent({ keepAlive: true })
	//const options1 = {
	//	agent: keepAliveAgent1,
	//	//host: 'acumaticasb.avantehs.com/entity/auth/login',
	//	host: 'acumaticasb.avantehs.com',
	//	//defaults to 443 if undefined
	//	//port: 443,
	//	path: '/entity/auth/login',
	//	method: 'POST'
	//}
	//var req = https.request(options1, function (res) { })
	//req.on('error', function (e) {
	//	console.log('problem with request: ' + e.message)
	//})
	//req.end()

	//const keepAliveAgent2 = new http.Agent({ keepAlive: true })
	//const options2 = {
	//	agent: keepAliveAgent,
	//	host: 'https://acumaticasb.avantehs.com/entity/AHS/18.200.003/CasesRTT?$expand=CasesRTTDetails',
	//	method: 'PUT'
	//}
	//http.request(options, onResponseCallback)
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
const getCaseData = async () => {
	const login = await axios.post(process.env.LOGIN_URI, {
		name: process.env.LOGIN_NAME,
		password: process.env.LOGIN_PW,
		company: process.env.LOGIN_COMPANY
	})
	if (process.env.DEBUG) {
		console.log("login")
	}

	const cookie = parseCookie(login)

	const cases = await axios.put(process.env.CASES_URI, {}, {
		headers: {
			Cookie: cookie
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
	const newCase = {}
	for (prop in c) {
		newCase[prop] = null
		if (c[prop] != null) {
			if (Object.keys(c[prop]).length != 0) {
				newCase[prop] = c[prop].hasOwnProperty('value') ? c[prop].value : c[prop]
			}
		}
	}
	newCase.acumatica_id = newCase.id
	delete newCase.id
	return newCase
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