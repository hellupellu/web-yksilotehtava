const API_URL =
  "https://media2.edu.metropolia.fi/restaurant/api/v1/restaurants";

const restaurantList = document.querySelector("#restaurant-list");
const selectedRestaurantText = document.querySelector("#selected-restaurant");

let selectedRestaurant = null;
let authToken = null;

// Tähtisuosikkien tallennus selaimeen
const favorites = new Set(
  JSON.parse(localStorage.getItem("restaurantFavorites") || "[]"),
);

// Haetaan ravintolat ja näytetään ne taulukossa
const getRestaurants = async () => {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP-virhe: ${response.status}`);
    }

    const data = await response.json();

    const cityFilter = document.querySelector("#city-filter");
    const companyFilter = document.querySelector("#company-filter");
    const favoriteSelect = document.querySelector("#profile-favorite");

    // Kerätään kaupungit ilman samoi nimiä
    const cities = [];

    data.forEach((restaurant) => {
      if (!cities.includes(restaurant.city)) {
        cities.push(restaurant.city);
      }
    });

    cities.sort((a, b) => a.localeCompare(b, "fi"));

    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      cityFilter.appendChild(option);
    });

    // Haetaan palveluntarjoajat ilman samoi nimiä
    const companies = [];

    data.forEach((restaurant) => {
      if (!companies.includes(restaurant.company)) {
        companies.push(restaurant.company);
      }
    });

    companies.sort((a, b) => a.localeCompare(b, "fi"));

    companies.forEach((company) => {
      const option = document.createElement("option");
      option.value = company;
      option.textContent = company;
      companyFilter.appendChild(option);
    });

    // Lisätään ravintolat profiilin suosikkivalikkoon
    data.forEach((restaurant) => {
      const option = document.createElement("option");
      option.value = restaurant._id;
      option.textContent = restaurant.name;
      favoriteSelect.appendChild(option);
    });

    restaurantList.innerHTML = "";

    data.forEach((restaurant) => {
      const row = document.createElement("tr");

      // Tallennetaan riville tiedot suodattimia varten
      row.dataset.restaurantId = restaurant._id;
      row.dataset.company = restaurant.company;

      row.addEventListener("click", () => {
        selectedRestaurant = restaurant;
        selectedRestaurantText.textContent = `Valittu ravintola: ${restaurant.name}`;

        if (document.querySelector("#show-weekly").checked) {
          getWeeklyMenu(restaurant._id);
        } else {
          getDailyMenu(restaurant._id);
        }
      });

      const nameCell = row.insertCell();
      nameCell.textContent = restaurant.name;

      const cityCell = row.insertCell();
      cityCell.textContent = restaurant.city;

      const addressCell = row.insertCell();
      addressCell.textContent = restaurant.address;

      const favoriteCell = row.insertCell();
      const favoriteButton = document.createElement("button");
      favoriteButton.type = "button";
      favoriteButton.className = "favorite-button";
      favoriteButton.textContent = favorites.has(restaurant._id) ? "★" : "☆";

      favoriteButton.addEventListener("click", (event) => {
        event.stopPropagation();

        if (favorites.has(restaurant._id)) {
          favorites.delete(restaurant._id);
          favoriteButton.textContent = "☆";
        } else {
          favorites.add(restaurant._id);
          favoriteButton.textContent = "★";
        }

        localStorage.setItem(
          "restaurantFavorites",
          JSON.stringify(Array.from(favorites)),
        );

        filterRestaurants();
      });

      favoriteCell.appendChild(favoriteButton);
      restaurantList.appendChild(row);
    });

    sortRestaurants();
  } catch (error) {
    console.error("Ravintoloiden haku epäonnistui:", error);
  }
};

// Haetaan valitun ravintolan päivän ruokalista
const getDailyMenu = async (restaurantId) => {
  const dailyMenu = document.querySelector("#daily-menu");
  dailyMenu.textContent = "Ladataan ruokalistaa...";

  try {
    const response = await fetch(`${API_URL}/daily/${restaurantId}/fi`);

    if (!response.ok) {
      throw new Error(`HTTP-virhe: ${response.status}`);
    }

    const data = await response.json();
    dailyMenu.innerHTML = "";

    if (!data.courses || data.courses.length === 0) {
      dailyMenu.textContent = "Päivän ruokalistaa ei ole saatavilla.";
      return;
    }

    data.courses.forEach((course) => {
      const paragraph = document.createElement("p");
      const price = course.price ? ` - ${course.price}` : "";
      const diets =
        course.diets && course.diets.length > 0 ? ` (${course.diets})` : "";

      paragraph.textContent = `${course.name}${price}${diets}`;
      dailyMenu.appendChild(paragraph);
    });
  } catch (error) {
    console.error("Ruokalistan haku epäonnistui:", error);
    dailyMenu.textContent = "Ruokalistaa ei voitu hakea.";
  }
};

// Haetaan valitun ravintolan viikon ruokalista
const getWeeklyMenu = async (restaurantId) => {
  const weeklyMenu = document.querySelector("#weekly-menu");
  weeklyMenu.textContent = "Ladataan ruokalistaa...";

  try {
    const response = await fetch(`${API_URL}/weekly/${restaurantId}/fi`);

    if (!response.ok) {
      throw new Error(`HTTP-virhe: ${response.status}`);
    }

    const data = await response.json();
    weeklyMenu.innerHTML = "";

    if (!data.days || data.days.length === 0) {
      weeklyMenu.textContent = "Viikon ruokalistaa ei ole saatavilla.";
      return;
    }

    data.days.forEach((day) => {
      const heading = document.createElement("h4");
      heading.textContent = day.date;
      weeklyMenu.appendChild(heading);

      day.courses.forEach((course) => {
        const paragraph = document.createElement("p");
        const price = course.price ? ` - ${course.price}` : "";
        const diets =
          course.diets && course.diets.length > 0 ? ` (${course.diets})` : "";

        paragraph.textContent = `${course.name}${price}${diets}`;
        weeklyMenu.appendChild(paragraph);
      });
    });
  } catch (error) {
    console.error("Viikon ruokalistan haku epäonnistui:", error);
    weeklyMenu.textContent = "Ruokalistaa ei voitu hakea.";
  }
};

document.querySelector("#show-daily").addEventListener("change", () => {
  if (selectedRestaurant) {
    getDailyMenu(selectedRestaurant._id);
  }
});

document.querySelector("#show-weekly").addEventListener("change", () => {
  if (selectedRestaurant) {
    getWeeklyMenu(selectedRestaurant._id);
  }
});

const searchInput = document.querySelector("#search");
const citySelect = document.querySelector("#city-filter");
const companySelect = document.querySelector("#company-filter");
const favoritesOnly = document.querySelector("#favorites-only");

// Näytetään ravintolat joita valinnat koskee
const filterRestaurants = () => {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedCity = citySelect.value;
  const selectedCompany = companySelect.value;
  const rows = restaurantList.querySelectorAll("tr");

  rows.forEach((row) => {
    const name = row.cells[0].textContent.toLowerCase();
    const city = row.cells[1].textContent;

    const matchesName = name.includes(searchText);
    const matchesCity = selectedCity === "all" || city === selectedCity;
    const matchesCompany =
      selectedCompany === "all" || row.dataset.company === selectedCompany;
    const matchesFavorite =
      !favoritesOnly.checked || favorites.has(row.dataset.restaurantId);

    row.hidden = !(
      matchesName &&
      matchesCity &&
      matchesCompany &&
      matchesFavorite
    );
  });
};

searchInput.addEventListener("input", filterRestaurants);
citySelect.addEventListener("change", filterRestaurants);
companySelect.addEventListener("change", filterRestaurants);
favoritesOnly.addEventListener("change", filterRestaurants);

const sortSelect = document.querySelector("#sort-order");

// Järjestetään ravintolat nimen mukaan
const sortRestaurants = () => {
  const rows = Array.from(restaurantList.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const nameA = a.cells[0].textContent;
    const nameB = b.cells[0].textContent;

    if (sortSelect.value === "öa") {
      return nameB.localeCompare(nameA, "fi");
    }

    return nameA.localeCompare(nameB, "fi");
  });

  rows.forEach((row) => restaurantList.appendChild(row));
};

sortSelect.addEventListener("change", sortRestaurants);

// Käyttäjätilin ikkunan avaaminen ja sulkeminen
const accountDialog = document.querySelector("#account-dialog");
const openAccount = document.querySelector("#open-account");
const closeAccount = document.querySelector("#close-account");

openAccount.addEventListener("click", () => {
  if (authToken) {
    document.querySelector("#logged-in-section").hidden = true;
    document.querySelector("#profile-section").hidden = false;
    document.querySelector("#profile-message").textContent = "";
  }

  accountDialog.showModal();
});

closeAccount.addEventListener("click", () => {
  accountDialog.close();
});

// Käyttäjän rekisteröityminen
const registerForm = document.querySelector("#register-form");
const registerMessage = document.querySelector("#register-message");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#register-username").value.trim();
  const email = document.querySelector("#register-email").value.trim();
  const password = document.querySelector("#register-password").value;

  try {
    const response = await fetch(
      "https://media2.edu.metropolia.fi/restaurant/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP-virhe: ${response.status}`);
    }

    registerMessage.textContent = "Rekisteröinti onnistui!";
    registerForm.reset();
  } catch (error) {
    console.error("Rekisteröinti epäonnistui:", error);
    registerMessage.textContent = "Rekisteröinti epäonnistui.";
  }
});

// Valikon nimeämisvaihto kirjautumisen ja rekisteröitymisen välillä
const loginSection = document.querySelector("#login-section");
const registerSection = document.querySelector("#register-section");

document.querySelector("#show-login").addEventListener("click", () => {
  loginSection.hidden = false;
  registerSection.hidden = true;
});

document.querySelector("#show-register").addEventListener("click", () => {
  loginSection.hidden = true;
  registerSection.hidden = false;
});

// Käyttäjän kirjautuminen
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#login-username").value.trim();
  const password = document.querySelector("#login-password").value;

  try {
    const response = await fetch(
      "https://media2.edu.metropolia.fi/restaurant/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP-virhe: ${response.status}`);
    }

    const data = await response.json();
    authToken = data.token;

    if (!authToken) {
      throw new Error("Kirjautumistunnistetta ei saatu.");
    }

    // Näytetään käyttäjän tiedot profiilissa
    document.querySelector("#profile-username").value = data.data.username;
    document.querySelector("#profile-email").value = data.data.email;
    document.querySelector("#profile-favorite").value =
      data.data.favouriteRestaurant || "";

    loginMessage.textContent = "";
    loginForm.reset();

    // Onnistumisilmoitus
    loginSection.hidden = true;
    registerSection.hidden = true;
    document.querySelector(".account-buttons").hidden = true;
    document.querySelector("#logged-in-section").hidden = false;
    document.querySelector("#profile-section").hidden = true;

    // Vaihdetaan yläpalkin painikkeen teksti
    openAccount.textContent = "Omat tiedot";
  } catch (error) {
    console.error("Kirjautuminen epäonnistui:", error);
    loginMessage.textContent = "Kirjautuminen epäonnistui.";
  }
});

// Käyttäjän tietojen päivittäminen
const profileForm = document.querySelector("#profile-form");
const profileMessage = document.querySelector("#profile-message");

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#profile-username").value.trim();
  const email = document.querySelector("#profile-email").value.trim();
  const favouriteRestaurant = document.querySelector("#profile-favorite").value;

  try {
    const response = await fetch(
      "https://media2.edu.metropolia.fi/restaurant/api/v1/users",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username, email, favouriteRestaurant }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP-virhe: ${response.status}`);
    }

    profileMessage.textContent = "Tiedot päivitetty!";
  } catch (error) {
    console.error("Tietojen päivitys epäonnistui:", error);
    profileMessage.textContent = "Tietojen päivitys epäonnistui.";
  }
});

// Käyttäjän uloskirjautuminen
document.querySelector("#logout-button").addEventListener("click", () => {
  authToken = null;

  openAccount.textContent = "Käyttäjätili";

  document.querySelector("#profile-section").hidden = true;
  document.querySelector("#logged-in-section").hidden = true;

  loginSection.hidden = false;
  registerSection.hidden = true;
  document.querySelector(".account-buttons").hidden = false;

  loginMessage.textContent = "Kirjauduttu ulos!";
  document.querySelector("#profile-message").textContent = "";
});

// Haetaan ravintolat, kun sivu on valmis
getRestaurants();
