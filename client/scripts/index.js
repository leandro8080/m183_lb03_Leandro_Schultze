document.addEventListener("DOMContentLoaded", () => {
	const newTweetInput = document.getElementById("new-tweet");
	const postTweetButton = document.getElementById("post-tweet");
	const logoutButton = document.getElementById("logout");

	const token = localStorage.getItem("token");

	const verifyToken = async () => {
		const response = await fetch("api/verify-token", {
			headers: { Authorization: `Bearer ${token}` }
		});
		const result = await response.text();
		console.log(result);
		if (result !== 200) {
			window.location.href = "/login.html";
		}
	};

	verifyToken();

	const generateTweet = (tweet) => {
		const date = new Date(tweet.timestamp).toLocaleDateString("de-CH", {
			hour: "numeric",
			minute: "numeric",
			second: "numeric"
		});
		const tweetElement = `
        <div id="feed" class="flex flex-col gap-2 w-full">
            <div class="bg-slate-600 rounded p-4 flex gap-4 items-center border-l-4 border-blue-400" >
                <img src="./img/tweet.png" alt="SwitzerChees" class="w-14 h-14 rounded-full" />
                <div class="flex flex-col grow">
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between text-gray-200">
                    <h3 class="font-semibold">${tweet.username}</h3>
                    <p class="text-sm">${date}</p>
                    </div>
                </div>
                <p>${tweet.text}</p>
                </div>
            </div>
        </div>
      `;
		return tweetElement;
	};

	const getFeed = async () => {
		const response = await fetch(`/api/feed`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const tweets = await response.json();
		const tweetsHTML = tweets.map(generateTweet).join("");
		document.getElementById("feed").innerHTML = tweetsHTML;
	};

	const postTweet = async () => {
		const timestamp = new Date().toISOString();
		const text = newTweetInput.value;
		await fetch("/api/feed", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ timestamp, text })
		});
		await getFeed();
		newTweetInput.value = "";
	};

	postTweetButton.addEventListener("click", postTweet);
	newTweetInput.addEventListener("keyup", (event) => {
		if (event.key === "Enter") {
			postTweet();
		}
	});

	logoutButton.addEventListener("click", () => {
		localStorage.removeItem("token");
		window.location.href = "/login.html";
	});

	getFeed();
});
