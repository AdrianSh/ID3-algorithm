"use strict"

class ID3 {
    /**
     * 
     * @param {*} tHeaders is a JSON structure as follows: 
     * {
     *  columnName:
     *  {
     *      values:
     *      {
     *          value:
     *          {
     *              count,
     *              decisionValues:
     *              {
     *                  dValue: { count }
     *              }
     *          }
     *      },
     *      sumCountValues
     *  }
     * }
     * 
     */
    constructor(tHeaders) {
        this.tHeaders = tHeaders;
        this.P_VALUE = "si";
        this.N_VALUE = "no";
        this.algorithm();
    }

    algorithm() {
        let columns = Object.getOwnPropertyNames(this.tHeaders);
        let columnMeritos = [];
        let decisionValues = this._extractDecisionValues(this.tHeaders[columns[columns.length - 1]]);

        for (let i = 0; i < columns.length - 1; i++) {
            // const tHeader = columns[i];
            // console.log(`Calc merito of the column: ${columns[i]}`);
            columnMeritos.push(this.merito(this.tHeaders[columns[i]], decisionValues));
        }

        let minMerito = columnMeritos.reduce((ac, v, v_i) => v < ac ? v : ac);
        // Devuelvo la columna de menor merito
        console.log(`columnMeritos:[${columnMeritos}]   min:${columns[columnMeritos.indexOf(minMerito)]}`);
    }

    _extractDecisionValues(tHeader) {
        return Object.getOwnPropertyNames(tHeader.values);
    }

    merito(tHeader, decisionValues) {
        let result = 0;
        let values = Object.getOwnPropertyNames(tHeader.values);
        for (let index = 0; index < values.length; index++) {
            const value = values[index];
            let valueInfo = tHeader.values[value];
            let r_i = valueInfo.count / tHeader.sumCountValues;

            let info = 0;
            for (const v of decisionValues) {
                let p = !Object.getOwnPropertyNames(valueInfo.decisionValues).includes(v) ? 0 : valueInfo.decisionValues[v].count / valueInfo.count;
                info += (p <= 0 ? 0 : -p * Math.log2(p));
            }
            result += r_i * info;
            // console.log(`r_i = ${r_i} * Info = ${info}   ==  ${result}`);
        }
        return result;
    }
}