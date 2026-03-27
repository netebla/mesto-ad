const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export class Api {
  constructor({ baseUrl, headers = {} }) {
    this._baseUrl = baseUrl;
    this._headers = { ...DEFAULT_HEADERS, ...headers };
  }

  _handleResponse(res) {
    if (res.ok) return res.json();
    return res
      .json()
      .catch(() => ({}))
      .then((data) => {
        const message =
          data && typeof data.message === "string"
            ? data.message
            : `HTTP error: ${res.status}`;
        return Promise.reject(new Error(message));
      });
  }

  _request(path, options = {}) {
    return fetch(`${this._baseUrl}${path}`, {
      ...options,
      headers: { ...this._headers, ...(options.headers || {}) },
    }).then(this._handleResponse);
  }

  getUserInfo() {
    return this._request("/users/me");
  }

  editProfile({ name, about }) {
    return this._request("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name, about }),
    });
  }

  updateAvatar({ avatar }) {
    return this._request("/users/me/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatar }),
    });
  }

  getCards() {
    return this._request("/cards");
  }

  addCard({ name, link }) {
    return this._request("/cards", {
      method: "POST",
      body: JSON.stringify({ name, link }),
    });
  }

  deleteCard(cardId) {
    return this._request(`/cards/${cardId}`, { method: "DELETE" });
  }

  likeCard(cardId) {
    return this._request(`/cards/likes/${cardId}`, { method: "PUT" });
  }

  unlikeCard(cardId) {
    return this._request(`/cards/likes/${cardId}`, { method: "DELETE" });
  }
}

