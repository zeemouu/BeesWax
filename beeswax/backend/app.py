from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS

##main

#bzzzz bzzz bz bz bzzz 
#🐝

app = Flask(__name__)
CORS(app)

@app.route("/check_website", methods=["GET"])
def check_website():
    domain = request.args.get("domain")
    conn = sqlite3.connect("coupons.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, code, rating , desc FROM coupons WHERE website = ?", (domain,))
    coupons = cursor.fetchall()
    conn.close()

    return jsonify({"success": True, "coupons": [{"id": c[0], "code": c[1], "rating": c[2] , "desc": c[3]} for c in coupons]})

@app.route("/add_coupon", methods=["POST"])
def add_coupon():
    data = request.json
    website = data["website"]
    coupon = data["coupon"]
    desc = data['desc']
    print(desc)

    conn = sqlite3.connect("coupons.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO coupons (website, code , rating ,  desc) VALUES (?,?,?,?)", (website, coupon ,0 , desc))
    
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/rate_coupon", methods=["POST"])
def rate_coupon():
    data = request.json
    coupon_id = data.get("coupon_id")
    rating_change = data.get("rating_change")

    conn = sqlite3.connect("coupons.db")
    cursor = conn.cursor()

    cursor.execute("UPDATE coupons SET rating = rating + ? WHERE id = ?",(rating_change, coupon_id))
    conn.commit()
    cursor.execute("SELECT rating FROM coupons WHERE id = ?", (coupon_id,))
    result = cursor.fetchone()

    if result:
        new_rating = result[0]
        if new_rating < 0:
            cursor.execute("DELETE FROM coupons WHERE id = ?", (coupon_id,))
            conn.commit()
            conn.close()
            return jsonify({"success": True, "deleted": True})
    conn.close()
    return jsonify({"success": True, "deleted": False})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
