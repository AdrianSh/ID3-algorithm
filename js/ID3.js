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
     * @param {*} tValues is an Array which describes a matrix containing the table values
     */
    constructor(tHeaders, tValues) {
        this.P_VALUE = "si";
        this.N_VALUE = "no";
        this.tree = [];
        this.id = 0;

        this.algorithm(tValues, tHeaders);

        var tree = this.tree;
        $('#tree').jstree({
            'core' : {
                'data' : function (obj, cb) {
                    cb.call(this, tree);
                }
            }});

        
    }

    algorithm(tValues, tHeaders, parent = '#') {
        let columns = Object.getOwnPropertyNames(tHeaders);
        let columnMeritos = [];
        let decisionValues = this._extractDecisionValues(tHeaders[columns[columns.length - 1]]);

        for (let i = 0; i < columns.length - 1; i++) {
            // const tHeader = columns[i];
            // console.log(`Calc merito of the column: ${columns[i]}`);
            columnMeritos.push(this.merito(tHeaders[columns[i]], decisionValues));
        }

        let minMerito = columnMeritos.length > 0 ? columnMeritos.reduce((ac, v, v_i) => v < ac ? v : ac) : columnMeritos;
        // Devuelvo la columna de menor merito        
        console.log(`columnMeritos:[${columnMeritos}]  minMerito:${minMerito}  min:${columns[columnMeritos.indexOf(minMerito)]}`);

        // Parameters for algorithm
        var cSelectedColumn = { index: columnMeritos.indexOf(minMerito), name: columns[columnMeritos.indexOf(minMerito)] };

        if(cSelectedColumn.name == undefined){
            // Final decision level
            let txt = `${tValues}`;
            this.tree.push({ "id" : this.id++, "parent" : parent, "text" : txt.length > 0 ? txt : '?', 'icon' : 'glyphicon glyphicon-leaf'  });
            return;
        }
        
        // Iterate every value of the selected column
        let columnValues = Object.getOwnPropertyNames(tHeaders[cSelectedColumn.name].values);

        // Check if for every values it has already a solution
        let dscValues = {};
        decisionValues.forEach(function(v){
            dscValues[v] = 0;
        });

        for (const value in columnValues) {
            let currDescValues = tHeaders[cSelectedColumn.name].values[value].decisionValues;
            for(let dscValue in currDescValues){
                dscValues[dscValue] += currDescValues[dscValue].count;
            }
        }

        let allValuesWithSameDesicionValue = true, descValue = null;
        for(let v in dscValues){
            if(!descValue) descValue = v;
            if(dscValues[v] > 0 && descValue != v) allValuesWithSameDesicionValue = false;
        }
        if(allValuesWithSameDesicionValue){
            // Final decision level
            let txt = `${descValue}`;
            this.tree.push({ "id" : this.id++, "parent" : parent, "text" : txt.length > 0 ? txt : '?', 'icon' : 'glyphicon glyphicon-leaf'  });
            return;
        }

        let id = this.id++;
        // Add to the tree
        this.tree.push({ "id" : id, "parent" : parent, "text" : cSelectedColumn.name, "icon" : "http://jstree.com/tree.png" });

        for (let i = 0; i < columnValues.length; i++) {
            const value = columnValues[i];

            // Add to the tree
            let vId = this.id++;
            this.tree.push({ "id" : vId, "parent" : id, "text" : `${cSelectedColumn.name} = ${value}` });
            
            let tNextHeaders = this._restoreHeader(tHeaders, cSelectedColumn.name);
            columns = Object.getOwnPropertyNames(tNextHeaders);

            // Prepare for the recursive call
            let tNextValues = tValues.filter(function (v) {
                return v[cSelectedColumn.index] == value;
            }).map(function (v, ind, arr) {
                let r = v.slice(0, cSelectedColumn.index).concat(v.slice(cSelectedColumn.index + 1, v.length));    
                return r;
            }.bind(this));
            this._countHeaders(tNextValues, tNextHeaders, columns);
            
            console.log(tNextHeaders);
            console.log(tNextValues);
            this.algorithm(tNextValues, tNextHeaders, vId);
        }
    }

    _extractDecisionValues(tHeader) {
        return Object.getOwnPropertyNames(tHeader.values);
    }

    _restoreHeader(tHeaders, cSelectedColumnName) {
        var tNextHeaders = JSON.parse(JSON.stringify(tHeaders));

        for (let columnName in tNextHeaders) {
            if (columnName == cSelectedColumnName) {
                delete tNextHeaders[columnName];
                continue;
            }
            let tHeader = tNextHeaders[columnName];
            tHeader.sumCountValues = 0;
            for (let columnValue in tHeader.values) {
                let tHeaderValue = tHeader.values[columnValue];
                tHeaderValue.count = 0;
                for (let decisionValue in tHeaderValue.decisionValues) {
                    tHeaderValue.decisionValues[decisionValue].count = 0;
                }
            }
        };

        return tNextHeaders;
    }

    _countHeaders(tValues, tHeaders, columns){
        tValues.forEach(function(row, rInd){
            row.forEach(function (val, cInd) {
                // console.log(tHeaders[columns[cInd]]);
                // console.log(val);
                tHeaders[columns[cInd]].values[val].count += 1;
                tHeaders[columns[cInd]].sumCountValues += 1;
                tHeaders[columns[cInd]].values[val].decisionValues[row[row.length - 1]].count += 1;
            });
        });
    }

    merito(tHeader, decisionValues) {
        let result = 0;
        let values = Object.getOwnPropertyNames(tHeader.values);
        for (let index = 0; index < values.length; index++) {
            const value = values[index];
            let valueInfo = tHeader.values[value];
            let r_i = valueInfo.count > 0 ? valueInfo.count / tHeader.sumCountValues : 0;

            let info = 0;
            for (const v of decisionValues) {
                let p = !Object.getOwnPropertyNames(valueInfo.decisionValues).includes(v) ? 0 : (valueInfo.decisionValues[v].count > 0 ? valueInfo.decisionValues[v].count / valueInfo.count : 0);
                info += (p <= 0 ? 0 : -p * Math.log2(p));
                // console.log(`info += ${p}`);
            }
            result += r_i * info;
            // console.log(`r_i = ${r_i} * Info = ${info}   ==  ${result}`);
        }
        return result;
    }
}