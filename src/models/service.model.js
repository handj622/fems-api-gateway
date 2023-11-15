const query = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
class ServiceModel {
    tableName = 'fems_edges';

    find = async (params = {}) => {
        let sql = `SELECT * FROM ${this.tableName}`;

        if (!Object.keys(params).length) {
            sql += ` WHERE status = 1`
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet} and status = 1`;

        return await query(sql, [...values]);
    }

    findOne = async (params) => {
        const { columnSet, values } = multipleColumnSet(params);

        const sql = `SELECT * FROM ${this.tableName}
        WHERE ${columnSet} and status = 1`;

        const result = await query(sql, [...values]);

        // return back the first row (data)
        return result;
    }
}

module.exports = new ServiceModel;
