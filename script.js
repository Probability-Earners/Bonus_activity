// script.js

// 1) Show/hide UPI vs Bank fields
const upiFields = document.getElementById("upiFields");
const bankFields = document.getElementById("bankFields");
const choiceRadios = document.getElementsByName("paymentType");

choiceRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (radio.value === "upi" && radio.checked) {
      upiFields.classList.remove("hidden");
      bankFields.classList.add("hidden");

      document.getElementById("upiAddress").required = true;
      document.getElementById("upiName").required = true;
      document.getElementById("accNumber").required = false;
      document.getElementById("ifsc").required = false;
      document.getElementById("accName").required = false;
    }
    if (radio.value === "bank" && radio.checked) {
      bankFields.classList.remove("hidden");
      upiFields.classList.add("hidden");

      document.getElementById("accNumber").required = true;
      document.getElementById("ifsc").required = true;
      document.getElementById("accName").required = true;
      document.getElementById("upiAddress").required = false;
      document.getElementById("upiName").required = false;
    }
  });
});

// 2) Form submit handler
async function submitHandler(event) {
  event.preventDefault();
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.classList.add("hidden");
  statusDiv.textContent = "";

  // 1) Get bonus app from dropdown
  const siteSelect = document.getElementById("siteSelect");
  const bonusApp = siteSelect.value;
  if (!bonusApp) {
    alert("Please select a site from the dropdown.");
    return;
  }

  // 2) Get payment type
  const selectedType = document.querySelector('input[name="paymentType"]:checked').value;
  
  // Create the data object with default values
  const formData = {
    bonusApp: bonusApp,
    paymentType: selectedType,
    upiId: "none",
    accountNumber: "none",
    accountIfsc: "none",
    name: "",
    images: {}
  };

  // 3) Collect payment details based on type
  if (selectedType === "upi") {
    const upiAddr = document.getElementById("upiAddress").value.trim();
    const upiName = document.getElementById("upiName").value.trim();
    
    if (!upiAddr || !upiName) {
      alert("Please fill all UPI fields");
      return;
    }
    
    formData.upiId = upiAddr;
    formData.name = upiName;
  } else {
    const accNum = document.getElementById("accNumber").value.trim();
    const ifsc = document.getElementById("ifsc").value.trim();
    const accName = document.getElementById("accName").value.trim();
    
    if (!accNum || !ifsc || !accName) {
      alert("Please fill all bank account fields");
      return;
    }
    
    formData.accountNumber = accNum;
    formData.accountIfsc = ifsc;
    formData.name = accName;
  }

  // 4) Get image files
  const deposit1File = document.getElementById("depositReceipt1").files[0];
  const deposit2File = document.getElementById("depositReceipt2").files[0];
  const deposit3File = document.getElementById("depositReceipt3").files[0];
  const wagerFile = document.getElementById("wagerScreenshot").files[0];
  const idFile = document.getElementById("idScreenshot").files[0];

  if (!deposit1File || !deposit2File || !deposit3File || !wagerFile || !idFile) {
    alert("Please upload all five required images");
    return;
  }

  // Show conversion status
  statusDiv.textContent = "Converting images to base64...";
  statusDiv.classList.remove("hidden");

  try {
    // Convert all files to image objects with metadata
    const [deposit1Img, deposit2Img, deposit3Img, wagerImg, idImg] = await Promise.all([
      fileToImageObject(deposit1File),
      fileToImageObject(deposit2File),
      fileToImageObject(deposit3File),
      fileToImageObject(wagerFile),
      fileToImageObject(idFile)
    ]);

    // Add image objects to formData with certified names
    formData.images = {
      depositReceipt1: deposit1Img,
      depositReceipt2: deposit2Img,
      depositReceipt3: deposit3Img,
      wagerScreenshot: wagerImg,
      idScreenshot: idImg
    };

    // Log the complete data object to console
    console.log("Form submission data with image metadata:", formData);
    
    // Call submission handler with the data object
    handleFormSubmission(formData);
    
  } catch (error) {
    console.error("Image conversion failed:", error);
    statusDiv.textContent = "Failed to process images. Please try again.";
  }
}

// Helper function to convert File to image object with metadata
function fileToImageObject(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extract just the base64 portion
      const base64String = reader.result.split(",")[1];

      // Extract name without extension
      const nameOnly = file.name.split(".").slice(0, -1).join(".");

      // Create image object with filtered metadata
      resolve({
        base64: base64String,
        filename: nameOnly,
        type: file.type
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// 3) ISOLATED SUBMISSION HANDLER - Only modify this for submission changes
function handleFormSubmission(payload) {
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.textContent = "Uploading data to server...";
  statusDiv.classList.remove("hidden");

  fetch("https://script.google.com/macros/s/AKfycbzHqsMg2O7ffKNVqnK_fp1hPeC-GzjFCkwIyI2LWeCTGJwk_WXJPsf_qk9jwXCRewtG/exec", {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then((res) => res.text())
    .then((msg) => {
      statusDiv.textContent = "Form submitted successfully!";
      console.log("Server response:", msg);
    })
    .catch((err) => {
      console.error("Upload failed", err);
      statusDiv.textContent = "Error uploading form. Try again.";
    });
}

// At page load, wire up the handler
document.getElementById("bonusForm").addEventListener("submit", submitHandler);