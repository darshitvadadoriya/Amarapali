// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Bar Numbers", {
	refresh(frm) {
        if (!frm.is_new()) {
            frm.set_df_property("item_code", "read_only", 1);
            frm.set_df_property("warehouse", "read_only", 1);
            frm.set_df_property("weight", "read_only", 1);
            frm.set_df_property("status", "read_only", 1);
        }
	},
    in_active:function(frm){
        if(frm.doc.in_active == 1){
            frm.set_value("status","Inactive")
        }
        if(frm.doc.in_active == 0){
            frm.set_value("status","Active")
        }
    }
});
