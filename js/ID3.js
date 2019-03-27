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
        this.tree = [];
        this.id = 0;
        this.tHeaders = tHeaders;

        this.algorithm(tValues, tHeaders);

        var tree = this.tree;
        $('#tree').jstree({
            'core': {
                'data': function (obj, cb) {
                    cb.call(this, tree);
                }
            }
        });
        $('#evalID3').show();
    }

    algorithm(tValues, tHeaders, parent = '#') {
        try {
            if (tValues.length <= 1) { // Just a row
                this.tree.push({ "id": this.id++, "parent": parent, "text": tValues.length > 0 ? tValues[0][tValues[0].length - 1] : 'No values', 'icon': 'glyphicon glyphicon-leaf' });
                return;
            }

            if (Object.getOwnPropertyNames(tHeaders).length == 1) { // Just a column (desicion)
                this.tree.push({ "id": this.id++, "parent": parent, "text": `Conflict: ${tValues}`, 'icon': 'glyphicon glyphicon-leaf' });
                return;
            }

            // Dos it contains the same desicion value for all table rows
            let descValue = tValues[0][tValues[0].length - 1];
            for (const row of tValues)
                if (row[tValues[0].length - 1] != descValue) {
                    descValue = false;
                    break;
                }
            if (descValue) {
                this.tree.push({ "id": this.id++, "parent": parent, "text": descValue, 'icon': 'glyphicon glyphicon-leaf' });
                return;
            }

            // Let's do it:
            let columns = Object.getOwnPropertyNames(tHeaders);
            let columnMeritos = [];
            let decisionValues = this._extractDecisionValues(tHeaders[columns[columns.length - 1]]);

            // Calc merito for each column
            for (let i = 0; i < columns.length - 1; i++)
                columnMeritos.push(this.merito(tHeaders[columns[i]], decisionValues));

            // Get the min merito
            let minMerito = columnMeritos.length > 0 ? columnMeritos.reduce((ac, v, v_i) => v < ac ? v : ac) : columnMeritos;
            let cSelectedColumn = { index: columnMeritos.indexOf(minMerito), name: columns[columnMeritos.indexOf(minMerito)] };
            // console.log(`columnMeritos:[${columnMeritos}]  minMerito:${minMerito}  min:${columns[columnMeritos.indexOf(minMerito)]}`);
            console.log(`cSelectedColumn: ${JSON.stringify(cSelectedColumn)}`);

            if (cSelectedColumn.name == undefined) {
                let txt = `${tValues}`; // Final decision level
                this.tree.push({ "id": this.id++, "parent": parent, "text": txt, 'icon': 'glyphicon glyphicon-leaf' });
                return;
            }

            /** Check whether the column contains every value and if its desicion is the same for all.
                // Check if for every values it has already a solution
                let dscValues = {};
                decisionValues.forEach(function (v) {
                    dscValues[v] = 0;
                });

                for (const value in tHeaders[cSelectedColumn.name].values) {
                    // console.log(value);
                    let currDescValues = tHeaders[cSelectedColumn.name].values[value].decisionValues;
                    for (let dscValue in currDescValues) {
                        dscValues[dscValue] += currDescValues[dscValue].count;
                    }
                }

                let allValuesWithSameDesicionValue = true, descValue = null;
                for (let v in dscValues) {
                    if (!descValue) descValue = v;
                    if (dscValues[v] > 0 && descValue != v) allValuesWithSameDesicionValue = false;
                }
                if (allValuesWithSameDesicionValue) {
                    console.log(`All values contains the same desicion value: ${descValue}`);

                    // Final decision level
                    let txt = `${descValue}`;
                    this.tree.push({ "id": this.id++, "parent": parent, "text": txt.length > 0 ? txt : '?', 'icon': 'glyphicon glyphicon-leaf' });
                    return;
                }
            */

            // Add the selected column to the trees
            let id = this.id++;
            this.tree.push({ "id": id, "parent": parent, "text": cSelectedColumn.name, "icon": "http://jstree.com/tree.png" });

            // Iterate over each column value
            for (const value in tHeaders[cSelectedColumn.name].values) {
                // Add to the tree
                let vId = this.id++;
                this.tree.push({ "id": vId, "parent": id, "text": `${cSelectedColumn.name} = ${value}` });

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

                console.log(`-------------------- NEXT ITERATION ----------- `);
                console.log(`${cSelectedColumn.name} = ${value}`);
                console.log(`tNextHeaders:`);
                console.log(tNextHeaders);
                console.log(`tNextValues:`);
                console.log(tNextValues);
                this.algorithm(tNextValues, tNextHeaders, vId);
            }
        } catch (e) {
            console.warn('Current tHeaders:');
            console.warn(tHeaders);
            console.warn('Current tValues');
            console.warn(tValues);
            throw e;
        }
    }

    evaluate(tValues) {
        console.log('----------------------- EVALUATE ---------------------');
        console.log(tValues);
        // console.log(this.tree);

        let i = 1;
        var column = this._treeSearchBy()[0]; // Root
        while (i < Object.keys(this.tHeaders).length) {
            console.log(`Column: ${column.text} ${typeof(this.tHeaders[column.text])}`);
            if(typeof(this.tHeaders[column.text]) == 'undefined' )
                return column.text;
            // console.log(`tHeader: ${this.tHeaders[column.text]}`);
            let value = tValues[this.tHeaders[column.text].index];

            console.log(`${column.text} = ${value}`);
            console.warn('Next level');
            console.log(this._treeSearchBy(column.id));
            let nodeWithValue = this._treeSearchBy(column.id).find(e => e.text == `${column.text} = ${value}`);
            if(typeof(nodeWithValue) == 'undefined')
                return 'Undefined';
            
            column = this._treeSearchBy(nodeWithValue.id)[0];
            i++;
        }

        return undefined;
    }

    _treeSearchBy(id = '#', column = 'parent') {
        return this.tree.filter(e => e[column] == id);
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

    _countHeaders(tValues, tHeaders, columns) {
        tValues.forEach(function (row, rInd) {
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