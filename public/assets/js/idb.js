let db;

const request = indexedDB.open('pizza_hunt', 1);

// this event will emit if the database version changes (nonexistent to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (e) {
	// save a reference to the database
	const db = e.target.result;
	// create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts
	db.createObjectStore('new_pizza', { autoIncrement: true });
};

request.onsuccess = function (e) {
	// when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
	db = e.target.result;

	// check if app is online, if yes run uploadPizza() function to send all local db data to api
	if (navigator.onLine) {
		uploadPizza();
	}
};

request.onerror = function (e) {
	console.log(e.target.errorCode);
};

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
	// open a new transaction with the database with read and write permissions
	const transaction = db.transaction(['new_pizza'], 'readwrite');

	// access the object store for 'new_pizza'
	const pizzaObjectStore = transaction.objectStore('new_pizza');

	pizzaObjectStore.add(record);
}

function uploadPizza() {
	// open a transaction on your db
	const transaction = db.transaction(['new_pizza'], 'readwrite');

	const pizzaObjectStore = transaction.objectStore('new_pizza');

	// get all records from store and set to a variable
	const getAll = pizzaObjectStore.getAll();

	getAll.onsuccess = async function () {
		if (!getAll.result.length) return;
		try {
			const response = await fetch('/api/pizzas', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			});
			const serverResponse = response.json();
			if (serverResponse.message) throw new Error(serverResponse);

			const transaction = db.transaction(['new_pizza'], 'readwrite');
			const pizzaObjectStore = transaction.objectStore('new_pizza');
			pizzaObjectStore.clear();

			alert('All saved pizza has been submitted!');
		} catch (err) {
			console.log(err);
		}
	};
}

window.addEventListener('online', uploadPizza);
