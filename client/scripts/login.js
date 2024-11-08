document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("login");
    const errorText = document.getElementById("error");

    loginButton.addEventListener("click", async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.text();
        if (response.status === 200) {
            localStorage.setItem("token", result);
            window.location.href = "/";
        } else {
            errorText.innerText = result;
        }
    });
});
