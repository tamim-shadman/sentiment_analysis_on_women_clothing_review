document.querySelector(".evaluate-btn").addEventListener("click", () => {
    const inputText = document.getElementById("input").value;

    if (inputText.trim() === "") {
        alert("Please enter review text first");
        return;
    }

    fetch("https://sawcrep-api.onrender.com/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ review_text: inputText }),
    })
        .then((response) => response.json())
        .then((data) => {
            let popupContainer = document.getElementById("popup-container");

            fetch("popup.html")
                .then((response) => response.text())
                .then((html) => {
                    popupContainer.innerHTML = html;

                    let popupHeader = document.getElementById("popup-header");
                    let popupImage = document.querySelector(".popup img");

                    if (data.recommended_ind === 0) {
                        popupHeader.innerText = "Product Not Recommended";
                        popupImage.src = "cross.jpg";
                    } else if (data.recommended_ind === 1) {
                        popupHeader.innerText = "Product Recommended";
                        popupImage.src = "404-tick.png";
                    } else {
                        popupHeader.innerText = "Unexpected Recommendation Value";
                        popupImage.src = "404-tick.png";
                    }

                    openPopup();
                })
                .catch((error) => {
                    console.error("Error loading popup:", error);
                    alert(
                        "An error occurred while loading the popup. Please try again later."
                    );
                });
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("An error occurred. Please try again later.");
        });
});

function openPopup() {
    let popup = document.getElementById("popup");
    popup.classList.add("open-popup");
}

function closePopup() {
    let popup = document.getElementById("popup");
    popup.classList.remove("open-popup");
}
