$(document).ready(function () {
	var numColumns = 5;

	$('[data-toggle="tooltip"]').tooltip();
	var actions = $("table td:last-child").html();

	// Append table with add row form on add new button click
	$(".add-new").click(function () {
		$(this).attr("disabled", "disabled");
		var index = $("table tbody tr:last-child").index();
		var row = '<tr>';
		for (let i = 0; i < numColumns; i++) row += '<td><input type="text" class="form-control" name="" id=""></td>';
		row += '<td>' + actions + '</td></tr>';
		$("table").append(row);
		$("table tbody tr").eq(index + 1).find(".add, .edit").toggle();
		$('[data-toggle="tooltip"]').tooltip();
	});
	// Add row on add button click
	$(document).on("click", ".add", function () {
		var empty = false;
		var input = $(this).parents("tr").find('input[type="text"]');
		input.each(function () {
			if (!$(this).val()) {
				$(this).addClass("error");
				empty = true;
			} else {
				$(this).removeClass("error");
			}
		});
		$(this).parents("tr").find(".error").first().focus();
		if (!empty) {
			input.each(function () {
				$(this).parent("td").html($(this).val());
			});
			$(this).parents("tr").find(".add, .edit").toggle();
			$(".add-new").removeAttr("disabled");
		}
	});
	// Edit row on edit button click
	$(document).on("click", ".edit", function () {
		$(this).parents("tr").find("td:not(:last-child)").each(function () {
			$(this).html('<input type="text" class="form-control" value="' + $(this).text() + '">');
		});
		$(this).parents("tr").find(".add, .edit").toggle();
		$(".add-new").attr("disabled", "disabled");
	});
	// Delete row on delete button click
	$(document).on("click", ".delete", function () {
		$(this).parents("tr").remove();
		$(".add-new").removeAttr("disabled");
	});

	$(".run-id3").click(function () {

		// ######################################
		// ### From here is the ID3             #
		// ######################################
		var tHeaders = {};
		let SKIPCOLUMNS = 1;

		let tHeadersElms = $("table thead").find("th");
		for (let i = 0; i < (tHeadersElms.length - SKIPCOLUMNS); i++)
			tHeaders[$(tHeadersElms[i]).text()] = { index: i, values: {}, sumCountValues: 0 };

		var tValues = [];
		$("table tbody").find("tr").each(function (i) {
			let e = $(this);
			let values = [];
			let vElms = e.find("td");
			// Just afront every column of each row
			for (let j = 0; j < (vElms.length - SKIPCOLUMNS); j++) {
				let v = $(vElms[j]).text(); // Column value
				// Get the info about this column
				let tHeader = tHeaders[Object.getOwnPropertyNames(tHeaders)[j]];
				// Get column values for checking if the value is already in
				let tHeaderValues = Object.getOwnPropertyNames(tHeader.values);
				if (!tHeaderValues.includes(v)) {
					// if the column doesn't contains this value, lets add it
					tHeader.values[v] = { count: 1, decisionValues: {} };
				} else {
					// Otherwise just sum up its counter
					tHeader.values[v].count++;
				}

				// Increase the final counter (N)
				tHeader.sumCountValues++;
				values.push(v); // Add column values (making the grid of values)

				if (j == vElms.length - SKIPCOLUMNS - 1) {
					// Last column, decision column
					values.forEach(function (val, k) {
						tHeader = tHeaders[Object.getOwnPropertyNames(tHeaders)[k]];
						// If current column contains this decision value
						if (!Object.getOwnPropertyNames(tHeader.values[val].decisionValues).includes(v))
							tHeader.values[val].decisionValues[v] = { count: 0 };
						tHeader.values[val].decisionValues[v].count++;

						// console.log(`Adding the decision value to the column: ${v}`);

					}.bind(this));
				}
			}
			tValues.push(values);
		});

		// console.log(tHeaders);
		// console.log(tValues);

		var algorithm = new ID3(tHeaders);
	});
});