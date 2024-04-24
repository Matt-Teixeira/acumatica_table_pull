const axios = require("axios").default;
const fs = require('node:fs')
module.exports.compareRecords = (n, old) => {
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
module.exports.loadCaseData = async () => {
	const data = JSON.parse(fs.readFileSync('files/cases.txt', 'utf-8'))
	return data.data
}
module.exports.loginAcumaticaApi = async () => {
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
module.exports.getCaseData = async () => {
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
			fs.writeFileSync('files/cases.txt', JSON.stringify(cases.data))
		} catch (err) { }
	}
	return cases.data.CasesRTTDetails
}

module.exports.unNestCase = (c) => {
	const newCase = unNestObject(c)
	newCase.acumatica_id = newCase.id
	delete newCase.id
	return newCase
}
module.exports.unNestObject = (object) => {
	const newObject = {}
	for (prop in object) {
		newObject[prop] = null
		if (object[prop] != null) {
			if (Object.keys(object[prop]).length != 0) {
				newObject[prop] = object[prop].hasOwnProperty('value') ? object[prop].value : object[prop]
			}
		}
	}
	return newObject
}

module.exports.parseCookie = (response) => {
	const cookie = response.headers['set-cookie'].join(" ");

	return [
		cookie.match(/.ASPXAUTH=\w+/)[0],
		//cookie.match(/ASP.NET_SessionId=\w+/)[0],
		//cookie.match(/requestid=\w+/)[0],
		//cookie.match(/requeststat=\+st:\w+\+sc:~(\/\w+)+\+start:\w+\+tg:/)[0]
	].join("; ")
}