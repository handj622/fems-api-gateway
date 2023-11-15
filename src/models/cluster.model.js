const query = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
class ClusterModel {
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

    findOne = async (params) => {
        const { columnSet, values } = multipleColumnSet(params);

        const sql = `SELECT * FROM ${this.tableName}
        WHERE ${columnSet} and status = 1`;

        const result = await query(sql, [...values]);

        // return back the first row (data)
        return result;
    }
    
    create = async ({ clusterName, ip, port, status, clusterType, clusterCode }) => {
        const sql = `INSERT INTO ${this.tableName}
        (clusterName, ip, port, status, clusterType, clusterCode) VALUES (?,?,?,?,?,?)`;

        const result = await query(sql, [clusterName, ip, port, status, clusterType, clusterCode]);
        const affectedRows = result ? result.affectedRows : 0;

        return result;
    }

    update = async({clusterName, ip, port, clusterType}, clusterCode) => {
        const sql = `UPDATE ${this.tableName}
        SET clusterName = '${clusterName}',
            ip = '${ip}',
            port = ${port},
            clusterType = '${clusterType}'
        WHERE clusterCode = '${clusterCode}';`

        const result = await query(sql, [clusterName, ip, port, clusterType, clusterCode]);
        
        return result;
    }

    delete = async (params) => {
        console.log(params)
        const sql = `DELETE FROM ${this.tableName} WHERE clusterCode = '${params}';`

        const result = await query(sql,[params]);

        return result;
    }
}

module.exports = new ClusterModel;
