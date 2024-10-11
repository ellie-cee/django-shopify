import requests

class Recharge:
	def __init__(self,key):
		self.api_key = key
	def headers(self):
		return {
			"X-Recharge-Version": "2021-11",
			"Content-Type": "application/json",
			"X-Recharge-Access-Token": self.api_key
		}
	def url(self,url): 
		return "https://api.rechargeapps.com/%s" % (url)
	def get(self,url):
		print(self.url(url))
		return requests.get(self.url(url),headers=self.headers()).json()
	def post(self,url,body={}):
		return requests.post(self.url(url),data=json.dumps(body),headers=self.headers()).json()
	def put(self,url,body={}):
		return requests.put(self.url(url),data=json.dumps(body),headers=self.headers()).json()
	def delete(self,url):
		return requests.delete(self.url(url),headers=self.headers()).status_code