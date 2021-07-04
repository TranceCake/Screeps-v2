/**
 * Log.js
 *
 * ES6 log class for logging screeps messages with color, where it makes sense.
 */ 
class Log
{
	constructor() {
		throw new Error("Log is a static class");
	}
	
	/** */
	static info(msg) {
		this.toConsole(msg, 'cyan')
	}
	
	/** */
	static warn(msg) {
		this.toConsole(msg, 'orange');
	}
	
	/** */
	static error(msg) {
		this.toConsole(msg, 'red');
	}
	
	/** */
	static success(msg) {
		this.toConsole(msg, 'green');
	}
	
	static transferInfo(msg) {
	    this.toConsole(msg, 'khaki');
	}
	
	/**
	 * HTML table in console
	 * ex: Log.table(['a','b'], [[1,2],[3,4]])
	 */
	static table(headers, rows) {
		let msg = '<table>';
		_.each(headers, h => msg += '<th width="50px">' + h + '</th>');
		_.each(rows, row =>  msg += '<tr>' + _.map(row, el =>  `<th>${el}</th>`) + '</tr>');
		msg += '</table>'
		console.log(msg);
	}

	/** */
	static notify(msg, group=0, color='red') {
		this.toConsole(msg, color);
		Game.notify(msg, group);
	}
	
	/** */
	static toConsole(msg, color) {
		console.log(`<font color=${color}>${msg}</font>`); 
	}
	
}

module.exports = Log;