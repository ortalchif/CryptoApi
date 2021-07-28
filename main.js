let coins = [];

//functions on load//
$(async function () {
	coins = JSON.parse(localStorage.getItem("coins"));
	if (!coins || coins.lenght <= 0) {
		coins = await getCoins();
		//adding field to coin
		coins = coins.map((coin) => ({
			...coin, //All existing fields
			checked: false, //The field added
		}));
		localStorage.setItem("coins", JSON.stringify(coins)); //local storage
	}
	$("#throbber").hide(); //Hide the loader
	$(".modal").modal("hide"); //Hide the modal
	printCards(coins); //prinnt coin cards to home page

	$("#homeBtn").on("click", function () {
		//The home button prints the tickets to the home page without refresh the page
		printCards(coins);
	});

	$("#clearBtn").on("click", function () {
		//Clear all toggle& refresh
		location.reload();
	});

	$("#showBtn").on("click", () => showToggle(coins)); //show all checked coins

	$("#aboutBtn").on("click", about); //about btn

	$("#searchBtn").on("click", () => search(coins)); //search btn
});

//get coin from API
async function getCoins() {
	try {
		return await $.ajax({
			url: "https://api.coingecko.com/api/v3/coins/",
		});
	} catch {
		console.log(error);
	}
}

//modal body
function modalBody(extraCoin) {
	const modalBody = $(".modal-body");
	modalBody.html("");
	const checkedCoins = coins.filter((coin) => coin.checked);
	for (const coin of checkedCoins) {
		modalBody.append(`<div>${
			coin.name
		}  <div class="custom-control custom-switch modalShow">
    <input onclick="toggle(this)" id="${
			coin.id
		}" type="checkbox" class="custom-control-input toggler-input" ${
			coin.checked ? "checked" : "unchecked"
		} />
    <label class="custom-control-label " for="${coin.name}"></label>
    </div></div> `);
	}
	modalBody.append(`<div>${
		extraCoin.name
	}  <div class="custom-control custom-switch modalShow ">
  <input onclick="toggle(this)" id="${
		extraCoin.id
	}" type="checkbox" class="custom-control-input toggler-input" ${
		extraCoin.checked ? "checked" : "unchecked"
	} />
  <label class="custom-control-label" for="${extraCoin.name}"></label>
  </div></div>`);
}

//check if more then 5 coins are checked
let toggle = function (toggler) {
	const coin = coins.filter((coin) => coin.id === toggler.id)[0];
	//it return arr with one checked coin
	if (!coin.checked) {
		const numOfChecked = coins.filter((coin) => coin.checked)?.length;
		// check num of checked coins
		if (numOfChecked >= 5) {
			$(".modal").modal("show");
			modalBody(coin);
			printCards(coins);
			return;
		}
	}
	coin.checked = !coin.checked;
	printCards(coins);
};

//show toggle btn
function showToggle(coins) {
	const coin = coins.filter((coin) => coin.checked === true);
	if (coin.length === 0) {
		$(".coins-container").html("");
		$(".coins-container").append(`<div class="nocard"> No Coins </div>`);
	} else {
		printCards(coin);
	}
}

//search func
function search(coins) {
	const searchValue = $("#searchInput").val().toLowerCase();
	$("#throbber").show();
	//if coins array not empty- ? , filter- return array//
	let coinsResult = coins?.filter(
		(coin) =>
			coin.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
			coin.name.toLowerCase().includes(searchValue.toLowerCase())
	);

	$("#throbber").hide();
	//if the input search is invalid: numbers/invalid character/empty/coin doesn't found
	if (!isNaN(searchValue) || !searchValue || coinsResult?.length === 0) {
		$(".coins-container").html("");
		$(".coins-container").append(
			`<div class="numericSearch"> Search input is invalid/not found,<br>
			 please enter coin id/name/symbol </div>`
		);
	} else {
		printCards(coinsResult);
	}
}

//print cards to page
function printCards(coins) {
	$(".coins-container").html("");
	if (coins) {
		for (let coin of coins) {
			$(".coins-container").append(`
    <div class="card coinCard" style="width: 210px;">
    <div class="card-header">
    <h5 class="card-title">${coin.symbol}</h5>
  
	
    <div class="custom-control custom-switch">
    <input onclick="toggle(this)" id="${
			coin.id
		}" type="checkbox" class="custom-control-input toggler-input" ${
				coin.checked ? "checked" : "unchecked"
			} />
    <label class="custom-control-label" for="${coin.name}"></label>
    </div>

    </div>
    <div class="card-body">
    <p class="card-text">${coin.name}</p>
    <p>
    <button
    class="btn btn-success moreInfoBtn"
    id="${coin.id}"
    onclick="handleMoreInfo(this)" 
    type="button"
    data-toggle="collapse"
    data-target="#coll${coin.symbol}"
    aria-expanded="false"
    aria-controls="coll${coin.symbol}"
    >
    More Info
    </button>
    <div class="collapse" id="coll${coin.symbol}">
    <div class=" spinner-border spinner-border-sm text-text-secondary" role="status">
    <span class="sr-only">Loading...</span>
  </div>
    </div>
    </div>
    </div>
    </p>
    `);
		}
	}
}

//remove item after 2 min
function getWithExpiry(key) {
	const itemStr = localStorage.getItem(key);
	// if the item doesn't exist, return null
	if (!itemStr) {
		return null;
	}
	const item = JSON.parse(itemStr);
	const now = new Date();
	// compare the expiry time of the item with the current time
	if (now.getTime() > item.expiry) {
		// If the item is expired, delete the item from storage
		// and return null
		localStorage.removeItem(key);
		return null;
	}
	return item;
}
// more info for 2 min
async function handleMoreInfo(btn) {
	changeBtnText(btn);
	const now = new Date();
	const ttl = 120000;
	let coin = getWithExpiry(btn.id);
	if (!coin) {
		coin = await getMoreInfo(btn);
		coin["expiry"] = now.getTime() + ttl;
		localStorage.setItem(coin.id, JSON.stringify(coin));
	}
	collapseMoreInfo(coin);
}

//more info details from API
async function getMoreInfo(btn) {
	try {
		let coin = await fetch(`https://api.coingecko.com/api/v3/coins/${btn.id}`);
		coin = coin.json();
		return coin;
	} catch (error) {
		console.log("coin not found");
	}
}

//print more info details
function collapseMoreInfo(coin) {
	$(`#coll${coin.symbol}`).html(`
  USD: ${coin.market_data.current_price.usd}$ <br>
  EUR: ${coin.market_data.current_price.usd}€ <br>
  ILS: ${coin.market_data.current_price.usd}₪ <br>
  <div class="coinImg">
  <img src="${coin.image.small}">
  </div>
  `);
}

//change "more info" to "less info"
function changeBtnText(btn) {
	if (btn.innerText == "More Info") {
		btn.innerText = "Less Info";
	} else {
		if (btn.innerText == "Less Info") {
			btn.innerText = "More Info";
		}
	}
}

//about me
function about() {
	$(".coins-container").html("");
	$(".coins-container").append(
		`<div class="infoAboutMe"> <img class="picOfMe" src="PicOfMe.jpeg" style="width:200px"/> 
		<p class="infoText">My name is Ortal Chifrut, I'm 32 years old. 
		<br>I have a bachelor's degree and a teaching certificate in history from Ben-Gurion University.
		<br>Also have a B.Sc. in computer science from HIT.
		<br> Currently, Fullstack Developer programmer. 
		<br> In this project ןi created a Cryptonite website,
		<br> Crypto coins, it's symbol, data and some more info.
		<br> I implemented the following topics: HTML5, CSS3, Bootstrap, Javascript: Object, Async-Await, jQwery, Ajax (RESTful API). </p> </div>`
	);
}
