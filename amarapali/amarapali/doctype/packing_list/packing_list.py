# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
import json
from frappe.model.document import Document


class PackingList(Document):
    def before_submit(self):
        
        match_qty = []
        
        if self.doctype_list == "Purchase Receipt":
            error_lst = []
            for data in self.purchase_items:
                doc_check = frappe.db.exists("Bar Numbers", {"bar_no": data.bar_no})
                
                if doc_check:
                    error_lst.append(data.bar_no)
            if not error_lst:
                for data in self.purchase_items:
                    doc = frappe.get_doc({
						"doctype": "Bar Numbers",
						"bar_no": data.bar_no,
						"item_code": data.item_code,
						"warehouse": data.warehouse,
						"weight": data.net_weight,
						"status": "Active"
					})
                    doc.insert()
            else:
                error_message = ", ".join(error_lst) + " Already exists in Bar Numbers"
                frappe.throw(error_message)
        
        # if doctype is delivery note
        if self.doctype_list == "Delivery Note":
            for data in self.delivered_items:
                doc = frappe.get_doc("Bar Numbers",data.bar_no)
                print(doc.name)
                print(doc.status)
                print(doc.item_code)
                print(doc.weight)
                print("\n\n\n\n\n\n\n\n\n\n")
                doc.status = "Delivered"
                doc.save()
                
       
        # if self.doctype_list == "Delivery Note":        
        #     dl_doc = get_delivery_note(self.document)
        #     mismatch_message = []
            
        #     for item_data in dl_doc.items:
        #         # Assuming 'data' contains packing list info like 'item_code' and 'net_weight'
        #         if item_data.qty != data.net_weight:
        #             mismatch_message.append(f"Item Code: {data.item_code}, Delivery Qty: {item_data.qty}, Packing List Qty: {data.net_weight}")
            
        #     if mismatch_message:
        #         frappe.msgprint("\n".join(mismatch_message))  # Raises error with all mismatches listed.
                



        
    
    
    def validate(self):
        row_no_lst = []
        unknown_lst = []
        
        if self.doctype_list == "Delivery Note":
            for data in self.delivered_items:
                print(data.bar_no)
                if not data.bar_no:
                    row_no_lst.append(str(data.idx))
                
                if data.bar_no:
                    dl_doc = get_delivery_note(self.document)
                    doc = bar_number_data(data.bar_no)
                    if doc.status == "Active":
                        data.item_code = doc.item_code
                        data.net_weight = doc.weight
                        data.warehouse = doc.warehouse
                    else:
                        error_message = doc.name + " - This bar number is inactive or delivered"
                        frappe.throw(error_message)
                   
                    for item_data in dl_doc.items:
                        if item_data.item_code != data.item_code:
                            unknown_lst.append(data.item_code)
                        
                            
                
            if row_no_lst:
                error_message = ", ".join(row_no_lst) + " - This row have not bar numbers"
                frappe.throw(error_message)
            if unknown_lst:
                error_message = ", ".join(unknown_lst) + " - This items not match from delivery note"
                frappe.throw(error_message)
                
                
        # set total qty in total quantity field
        if self.doctype_list == "Purchase Receipt":
            total_qty = sum(item.net_weight for item in self.purchase_items)
            self.total_bar_weight = total_qty
            self.total_bars = max(item.idx for item in self.purchase_items)
            
        if self.doctype_list == "Delivery Note":
            total_qty = sum(item.net_weight for item in self.delivered_items)
            self.total_bar_weight = total_qty
            # count child table total rows and set in bars
            self.total_bars = max(item.idx for item in self.delivered_items)
            
        
            
        
            
            
    
        

def bar_number_data(bar_no):
        bar_number_data = frappe.get_doc("Bar Numbers",bar_no)
        return bar_number_data
    
def get_delivery_note(delivery_id):
        delivery_note_data = frappe.get_doc("Delivery Note",delivery_id,as_dict=1)
        return delivery_note_data
    
    
@frappe.whitelist()
def get_doc_data(doctype,doc_name):
    print(doctype,doc_name)
    print("\n\n\n\n\n\n\n\n")
    return frappe.get_doc(doctype,doc_name)


# get used delibery noteid from packing list link field
@frappe.whitelist()
def get_used_delivery():
    used_delivery = []
    delivery = frappe.get_list("Packing List",fields=["document"],filters={"inout_ward":"Out Ward"})
    for data in delivery:
        used_delivery.append(data["document"])
    return used_delivery


# get used purchaser order id from packing list link field
@frappe.whitelist()
def get_used_purchase():
    used_purchase = []
    purchase = frappe.get_list("Packing List",fields=["document"],filters={"inout_ward":"In Ward"})
    for data in purchase:
        used_purchase.append(data["document"])
    return used_purchase

@frappe.whitelist()
def get_packing_list(name):
    packing_list = frappe.get_doc("Delivery Note",name,as_dict=1)
    return packing_list
    
    

# @frappe.whitelist()
# def check_qty(doc_name,name):
            
#             dl_doc = get_delivery_note(doc_name)
#             pl_doc = get_packing_list(name)
#             mismatch_message = []
            
#             for item_data in dl_doc.items:
                
#                 for pl_items in pl_doc.items:
#                     if item_data.qty < pl_items.net_weight or item_data.qty > pl_items.net_weight:
#                         mismatch_message.append(f"Item Code: {pl_items.item_code}, Delivery Qty: {item_data.qty}, Packing List Qty: {pl_items.net_weight}")
                
#             # if mismatch_message:
#             #     frappe.msgprint("\n".join(mismatch_message))  # Raises error with all mismatches listed.
#             return mismatch_message