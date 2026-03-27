const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  { currentUserId, onPreviewPicture, onLikeToggle, onDeleteRequest }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;

  const updateLikesView = (cardData) => {
    const likes = Array.isArray(cardData.likes) ? cardData.likes : [];
    const isLiked = currentUserId ? likes.some((u) => u && u._id === currentUserId) : false;

    likeButton.classList.toggle("card__like-button_is-active", isLiked);
    if (likeCountElement) likeCountElement.textContent = String(likes.length);
  };

  updateLikesView(data);

  if (onLikeToggle) {
    likeButton.addEventListener("click", () => {
      const isActive = likeButton.classList.contains("card__like-button_is-active");
      const shouldLike = !isActive;
      onLikeToggle(data._id, shouldLike)
        .then((updatedCard) => {
          data = updatedCard;
          updateLikesView(updatedCard);
        })
        .catch(() => {});
    });
  }

  const ownerId = data && data.owner ? data.owner._id : null;
  const isOwnCard = currentUserId && ownerId === currentUserId;

  if (!isOwnCard) {
    deleteButton.remove();
  } else if (onDeleteRequest) {
    deleteButton.addEventListener("click", () => {
      onDeleteRequest(data._id, cardElement);
    });
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () =>
      onPreviewPicture({ name: data.name, link: data.link })
    );
  }

  return cardElement;
};
