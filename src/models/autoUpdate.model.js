const query = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
class AutoUpdateModel {
    tableName = 'fems_edges';

    find = async (params = {}) => {
        let sql = `SELECT * FROM ${this.tableName}`;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        return await query(sql, [...values]);
    }
    UpdateRunning = async (ip) => {
        const sql = `UPDATE ${this.tableName} SET status = 1 WHERE ip = "${ip}"`
        
        const result = query(sql);

        return result;
    }
    UpdateNotRunning = async (ip) => {
        const sql = `UPDATE ${this.tableName} SET status = 0 WHERE ip = "${ip}"`
        
        const result = query(sql);

        return result;
    }
}

module.exports = new AutoUpdateModel;