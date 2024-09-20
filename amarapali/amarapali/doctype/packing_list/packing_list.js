// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

var item_code_lst = []
var validate

frappe.ui.form.on("Packing List", {

    setup: function (frm) {

        frm.get_docfield("purchase_items").allow_bulk_edit = 1; // set download and upload button for child table
        frm.get_docfield("delivered_items").allow_bulk_edit = 1; // set download and upload button for child table
    },
    refresh: function (frm) {
        // filters for child table items
        set_filter(frm)
    },

    inout_ward: function (frm) {
        var ward_value = frm.doc.inout_ward
        frm.doc.document = ""
        frm.clear_table("delivered_items"); //clear child table on change option
        frm.clear_table("purchase_items");; //clear child table on change option

        // if ward val is inward set purchase receipt
        if (ward_value == 'In Ward') {
            cur_frm.set_value("naming_series", "PR-PAC-.YYYY.-")
            cur_frm.set_value("doctype_list", "Purchase Receipt")
            frm.set_df_property("document", 'label', "Purchase Receipt");
            frm.set_df_property("total_bar_weight_from", 'label', "Total Bar Weight From Purchase Receipt");
            get_used_purchase(frm) // get used delivery note list

        }
        // if ward val is inward set delivery note
        if (ward_value == 'Out Ward') {
            cur_frm.set_value("naming_series", "DN-PAC-.YYYY.-")
            cur_frm.set_value("doctype_list", "Delivery Note")
            frm.set_df_property("document", 'label', "Delivery Note");
            frm.set_df_property("total_bar_weight_from", 'label', "Total Bar Weight From Delivery Note");
            get_used_delivery(frm) // get used delivery note list


            
        }



    },
    document: function (frm) {
        var doctype = frm.doc.doctype_list
        var doc_name = frm.doc.document

        frappe.call({
            method: "amarapali.amarapali.doctype.packing_list.packing_list.get_doc_data",
            args: {
                doctype: doctype,
                doc_name: doc_name,
            },
            callback: function (r) {
                item_code_lst = []
                var child_table

                console.log(r.message.items);
                var total_weight_from_prev = r.message.total_qty
                var items_data = r.message.items
                if (doctype == "Purchase Receipt") {
                    child_table = "purchase_items"
                    frm.clear_table("purchase_items");
                }
                if (doctype == "Delivery Note") {
                    child_table = "delivered_items"
                    frm.clear_table("delivered_items");
                }
                $.each(items_data, function (index, data) {
                    item_code_lst.push(data.item_code)
                    console.log(child_table);
                    // add record automatic in child table
                    frm.add_child(child_table, {
                        item_code: data.item_code,
                        warehouse: data.warehouse,
                        uom: data.uom
                    });
                })
                // refresh field after set data
                frm.refresh_field(child_table);


                frm.set_value("total_bar_weight_from", total_weight_from_prev) //set total qty as total_weight_from_prev from prevoius doc 

                // filters for child table items
                set_filter(frm)
            }
        })
    },

    // before_save: function (frm) {
    //     totl_bars(frm, frm.doc.delivered_items)
    // },
   




});


frappe.ui.form.on('Packing Purchase Items', {
    net_weight: function (frm, cdt, cdn) {
        totl_bars(frm, frm.doc.purchase_items);
    }
})

frappe.ui.form.on('Packing Delivery Items', {
    net_weight: function (frm, cdt, cdn) {
        totl_bars(frm, frm.doc.delivered_items);
    },
    // bar_no:function(frm, cdt, cdn) {
    //     const current_item = locals[cdt][cdn];
    //     const bar_no_value = current_item.bar_no;
    //     console.log(bar_no_value);
    //     get_bar_details(bar_no_value,cdt,cdn)
    //     frm.refresh_field("delivered_items");
    // }
})






function get_used_purchase(frm) {
    frappe.call({
        method: 'amarapali.amarapali.doctype.packing_list.packing_list.get_used_purchase',
        callback: function (r) {
            console.log(r);
            // set filters for purchase doc link field
            frm.set_query("document", function () {
                return {
                    filters: [
                        ["Purchase Receipt", "name", "not in", r.message]  // Filtering 'name' field in Delivery Note doctype
                    ]
                };
            });
            
            
        }
    })
}



function get_used_delivery(frm) {
    frappe.call({
        method: 'amarapali.amarapali.doctype.packing_list.packing_list.get_used_delivery',
        callback: function (r) {
            console.log(r);
            // set filters for delivery note doc link field
            frm.set_query("document", function () {
                return {
                    filters: [
                        ["Delivery Note", "name", "not in", r.message]  // Filtering 'name' field in Delivery Note doctype
                    ]
                };
            });
            
            
        }
    })
}





function totl_bars(frm, items) {
    console.log(items);
    var total_bars = 0;
    $.each(items, function (i, d) {
        total_bars += flt(d.net_weight);
    });
    frm.set_value("total_bar_weight", total_bars);
}


// filters for child table items
function set_filter(frm) {
    frm.fields_dict['purchase_items'].grid.get_field('item_code').get_query = function (doc, cdt, cdn) {
        var child = locals[cdt][cdn];
        console.log(child);
        return {
            filters: [
                ['item_code', 'in', item_code_lst]
            ]
        }
    }

    // filter item_code field in child table purchase_items
    frm.fields_dict['delivered_items'].grid.get_field('item_code').get_query = function (doc, cdt, cdn) {
        var child = locals[cdt][cdn];
        console.log(child);
        return {
            filters: [
                ['item_code', 'in', item_code_lst]
            ]
        }
    }
}