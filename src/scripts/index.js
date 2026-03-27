/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement } from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { Api } from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");
const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");
const logoElement = document.querySelector(".header__logo");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const infoModalWindow = document.querySelector(".popup_type_info");
const infoTitle = infoModalWindow.querySelector(".popup__title");
const infoList = infoModalWindow.querySelector(".popup__list");
const infoText = infoModalWindow.querySelector(".popup__text");
const infoDefinitionList = infoModalWindow.querySelector(".popup__info");
const infoDefinitionTemplate = document.getElementById("popup-info-definition-template");
const infoUserPreviewTemplate = document.getElementById("popup-info-user-preview-template");

const api = new Api({
  baseUrl: "https://nomoreparties.co/v1/apf-cohort-202",
  headers: {
    authorization: "c92449e2-0b04-455b-8ce4-ecf6fd3414bb",
  },
});

let currentUserId = null;
let cardsCache = [];
let pendingDeleteCardId = null;
let pendingDeleteCardElement = null;

const renderInfoPopup = () => {
  const cards = Array.isArray(cardsCache) ? cardsCache : [];
  const uniqueOwnersMap = new Map();
  cards.forEach((card) => {
    if (!card || !card.owner || !card.owner._id) return;
    if (!uniqueOwnersMap.has(card.owner._id)) {
      uniqueOwnersMap.set(card.owner._id, card.owner.name || "Пользователь");
    }
  });

  const totalUsers = uniqueOwnersMap.size;
  const totalLikes = cards.reduce(
    (sum, card) => sum + (Array.isArray(card.likes) ? card.likes.length : 0),
    0
  );
  const maxLikedCard = cards.reduce(
    (best, card) =>
      (card?.likes?.length || 0) > (best?.likes?.length || 0) ? card : best,
    null
  );
  const maxLikesFromOne = maxLikedCard?.likes?.length || 0;
  const likesChampion = maxLikedCard?.owner?.name || "—";

  infoTitle.textContent = "Статистика карточек";
  infoText.textContent = "Популярные карточки:";

  infoDefinitionList.innerHTML = "";
  const addDefinitionItem = (term, description) => {
    const node = infoDefinitionTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".popup__info-term").textContent = term;
    node.querySelector(".popup__info-description").textContent = description;
    infoDefinitionList.append(node);
  };

  addDefinitionItem("Всего пользователей:", String(totalUsers));
  addDefinitionItem("Лайков всего", String(totalLikes));
  addDefinitionItem("Максимально лайков от одного:", String(maxLikesFromOne));
  addDefinitionItem("Чемпион лайков:", likesChampion);

  const topCards = [...cards]
    .sort((a, b) => (b?.likes?.length || 0) - (a?.likes?.length || 0))
    .map((card) => card?.name || "")
    .filter(Boolean);

  infoList.innerHTML = "";
  topCards.forEach((cardName) => {
    const li = infoUserPreviewTemplate.content.firstElementChild.cloneNode(true);
    li.textContent = cardName;
    infoList.append(li);
  });
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const getCardHandlers = () => ({
  currentUserId,
  onPreviewPicture: handlePreviewPicture,
  onLikeToggle: (cardId, shouldLike) =>
    (shouldLike ? api.likeCard(cardId) : api.unlikeCard(cardId)).then((updatedCard) => {
      cardsCache = cardsCache.map((c) => (c._id === updatedCard._id ? updatedCard : c));
      return updatedCard;
    }),
  onDeleteRequest: (cardId, cardElement) => {
    pendingDeleteCardId = cardId;
    pendingDeleteCardElement = cardElement;
    openModalWindow(removeCardModalWindow);
  },
});

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  api
    .editProfile({
      name: profileTitleInput.value,
      about: profileDescriptionInput.value,
    })
    .then((user) => {
      profileTitle.textContent = user.name;
      profileDescription.textContent = user.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch(() => {});
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  api
    .updateAvatar({ avatar: avatarInput.value })
    .then((user) => {
      profileAvatar.style.backgroundImage = `url(${user.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch(() => {});
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  api
    .addCard({ name: cardNameInput.value, link: cardLinkInput.value })
    .then((card) => {
      cardsCache = [card, ...cardsCache];
      placesWrap.prepend(createCardElement(card, getCardHandlers()));
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch(() => {});
};

const handleRemoveCardFormSubmit = (evt) => {
  evt.preventDefault();
  if (!pendingDeleteCardId || !pendingDeleteCardElement) return;

  api
    .deleteCard(pendingDeleteCardId)
    .then(() => {
      cardsCache = cardsCache.filter((c) => c._id !== pendingDeleteCardId);
      pendingDeleteCardElement.remove();
      closeModalWindow(removeCardModalWindow);
      pendingDeleteCardId = null;
      pendingDeleteCardElement = null;
    })
    .catch(() => {});
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

logoElement.addEventListener("click", () => {
  renderInfoPopup();
  openModalWindow(infoModalWindow);
});

// загрузка данных с сервера
Promise.all([api.getUserInfo(), api.getCards()])
  .then(([user, cards]) => {
    currentUserId = user._id;
    cardsCache = cards;

    profileTitle.textContent = user.name;
    profileDescription.textContent = user.about;
    profileAvatar.style.backgroundImage = `url(${user.avatar})`;

    cards.forEach((card) => {
      placesWrap.append(createCardElement(card, getCardHandlers()));
    });
  })
  .catch(() => {});

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});
