const { Pool } = require('pg')
var fs = require('fs')

const pool = new Pool({
	user: process.env.PG_USER,
	host: process.env.PG_HOST,
	database: process.env.PG_DB,
	password: process.env.PG_PW,
	port: process.env.PG_PORT,
	ssl: {
		require: true,
		cert: fs.readFileSync(process.env.PG_SSL_PATH),
		rejectUnauthorized: true,
	}
})
module.exports.insertCase = async (c) => {
	const props = []
	for (prop in c) {
		props.push(prop)
	}
	let query = 'insert into public.cases('
	for (const [i, prop] of props.entries()) {
		query += `"${prop}"`
		query += (i == props.length - 1) ? '' : ', '
	}
	query += ') values ('
	for (const [i, prop] of props.entries()) {
		if (typeof c[prop] == 'object') {
			query += 'null'
		} else {
			query += typeof c[prop] == 'string' ? `'${c[prop]}'` : `${c[prop]}`
		}
		query += (i == props.length - 1) ? '' : ', '
	}
	query += ')'
	const client = await pool.connect()
	await client.query(query)
	client.release()
}
module.exports.updateCase = async (id, changes) => {
	let query = 'update public.cases set '
	const props = []
	for (prop in changes) {
		props.push(prop)
	}
	for (const [i, prop] of props.entries()) {
		query += `${prop} = `
		query += typeof changes[prop] == 'string' ? `'${changes[prop]}'` : `${changes[prop]}`
		query += (i == props.length - 1) ? ' ' : ', '
	}
	query += `where acumatica_id = '${id}'`
	const client = await pool.connect()
	await client.query(query)
	client.release()
}
module.exports.insertRunLog = async (runLog) => {
	const client = await pool.connect()
	await client.query("insert into util.unit_verifier(runlog) values ($1)", [runLog])
	client.release()
}
const update = async (system, value) => {
	const client = await pool.connect()
	const query = "update mag.ge_mm3_units set disp_mode = $2, last_updated_by = 'unit verifier', last_updated = current_timestamp where system_id = $1"
	await client.query(query, [system, value])
	client.release()
}
module.exports.updateChanges = async (system, object) => {
	const client = await pool.connect()
	let query = "update mag.ge_mm3_units set "
	for (prop in object.new) {
		query += `${prop} = '${object.new[prop]}', `
	}
	query += "last_updated_by = 'unit verifier', last_updated = current_timestamp, changed = true, changes = $2 where system_id = $1"
	await client.query(query, [system, object.old])
	client.release()
}
const getData = async () => {
	const client = await pool.connect()
	const cases = await client.query('select * from public.cases order by id')
	client.release()
	return cases.rows
}
const getData_old = async () => {
	const client = await pool.connect()
	const systems = await client.query('select * from public.systems order by id')
	const units = {
		//mmb_edu1: await client.query('select * from edu.v1_units'),
		"edu.v1": await client.query('select * from edu.v1_units'),
		mmb_edu2: await client.query('select * from edu.v2_units'),
		mmb_ge_mm3: await client.query('select * from mag.ge_mm3_units'),
		mmb_ge_mm4: await client.query('select * from mag.ge_mm4_units'),
		mmb_siemens: await client.query('select * from mag.siemens_units'),
		mmb_siemens_non_tim: await client.query('select * from mag.siemens_non_tim_units')
	}
	client.release()
	const tables = []
	for (const system of systems.rows) {
		if (system.mmb_config != null) {
			for (const rpp_config of system.mmb_config.rpp_configs) {
				tables.push(rpp_config.pgTable)
			}
		}
	}
	//console.log([...new Set(tables)])
	for (const system of systems.rows) {
		if (system.mmb_config != null) {
			system.units = []
			for (const rpp_config of system.mmb_config.rpp_configs) {
				//console.log(`System: ${system.id} Table: ${rpp_config.pgTable}`)
				system.units.push({
					type: rpp_config.pgTable,
					...units[rpp_config.pgTable].rows.find(e => e.system_id == system.id)
				})
			}
			console.log("");
		}
	}
	return systems.rows
}
module.exports.update = update;
module.exports.getData = getData;