const axios = require("axios");

async function testApi() {
  try {
    console.log("Testing API connection...");
    const response = await axios.get("http://localhost:5000/api/schedule");
    console.log("API Response:", response.data);
    console.log("Connection successful!");
  } catch (error) {
    console.error("API Connection Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
}

testApi();
