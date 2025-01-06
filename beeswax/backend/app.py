#version 1.02 

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.json_util import dumps
from datetime import datetime
import hashlib
import os

app = Flask(__name__)
CORS(app)

client = MongoClient(os.environ.get("mongo_uri")) # found in environment variables. use ('127.0.0.1' , 27017) or other if running locally
db = client["coupons_db"]
coll = db["coupons"]


def hashDomain(domain):
    return hashlib.sha256(domain.encode()).hexdigest()[:5]

def update_date(coupon): # supposed to be run every day to update dates. not automated yet lol

    if coupon.get('startDate'):
        if coupon.get('startDate'):
                start = datetime.strptime(coupon['startDate'], '%d-%m-%Y')
                expiry = datetime.strptime(coupon['expiryDate'], '%d-%m-%Y')

                start = start.replace(year=datetime.now().year)
                expiry = expiry.replace(year=datetime.now().year)

                if start > expiry:
                    expiry = expiry.replace(year = datetime.now().year +1)

                if start <= datetime.now() <= expiry:
                    coupon['hidden'] = False
                else:
                    coupon['hidden'] = True


        elif datetime.now() > datetime.strptime(coupon['expiryDate'] , '%d-%m-%Y'):
            coupon['hidden'] = True

    if not coupon.get("hash"):
        coupon['hash'] = hashDomain(coupon.get('website'))

    return coupon

@app.route("/check_website", methods=["GET"])
def check_website():
    hashedDomain = request.args.get("hashedDomain")
    coupons = list(coll.find({"hash": hashedDomain, "hidden": {"$ne": True}}, {"_id": 1, "website": 1 , "code": 1, "rating": 1, "desc": 1 , "expiryDate": 1}))

    for coupon in coupons:
        coupon["_id"] = str(coupon["_id"])
        if "expiryDate" not in coupon:
            coupon["expiryDate"] = None
            coupon["expiresIn"] = None
        else:
            coupon['expiresIn'] = (datetime.strptime(coupon['expiryDate'] , "%Y-%m-%d") - datetime.now()).days
        
    return jsonify({"success": True, "coupons": coupons})

@app.route("/update") 
def update():
    for coupon in coll.find():
        new = update_date(coupon)
        coll.update_one({'_id': coupon['_id']}, {'$set': {'hidden': new['hidden']}})
    return jsonify({"success": True, "message": "Coupons updated."})

@app.route("/add_coupon", methods=["POST"])  
def add_coupon():
    data = request.json
    website = data["website"]
    code = data["coupon"]
    desc = data['desc']
    couponType = data['type']
    
    if couponType =='expires':
        coupon = {"website": website, "code": code, "rating": 0, "desc": desc, "hash": hashDomain(website), 'expiryDate':data['expiryDate']}

    elif couponType == 'seasonal':
        coupon = {"website": website, "code": code, "rating": 0, "desc": desc, "hash": hashDomain(website), 'expiryDate':data['expiryDate'] ,  'startDate': data['startDate']}

    else:
        coupon = {"website": website, "code": code, "rating": 0, "desc": desc, "hash": hashDomain(website)}

    result = coll.insert_one(coupon)

    return jsonify({"success": True, "coupon_id": str(result.inserted_id)})

@app.route("/rate_coupon", methods=["POST"])
def rate_coupon():
    data = request.json
    coupon_id = data.get("coupon_id")
    rating_change = data.get("rating_change")
    
    print(f"Received coupon_id: {coupon_id}, rating_change: {rating_change}")

    try:
        coupon = coll.find_one({"_id": ObjectId(coupon_id)})
    except Exception as e:
        print(f"Error converting coupon_id to ObjectId: {e}")
        return jsonify({"success": False, "message": "Invalid coupon_id"}), 400

    if coupon:
        new_rating = coupon.get("rating", 0) + rating_change
        if new_rating < 0:
            coll.update_one({"_id": ObjectId(coupon_id)}, {"$set": {"rating": new_rating}})
            coll.update_one({"_id": ObjectId(coupon_id)}, {"$set": {"hidden": True}})
            return jsonify({"success": True, "deleted": True})
        else:
            coll.update_one({"_id": ObjectId(coupon_id)}, {"$set": {"rating": new_rating}})
            return jsonify({"success": True, "deleted": False})

    return jsonify({"success": False, "message": "Coupon not found"}), 404

@app.route('/display_data', methods =['GET' , 'POST']) # fyi before using: its ugly
def display():
     return jsonify(dumps(list(coll.find())))


if __name__ == "__main__":
    app.run(host="::", port=5000)
