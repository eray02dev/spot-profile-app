import {
  resetValidation,
  disableButton,
  settings,
  enableValidation,
} from "./validation.js";
import Api from "./utils/Api.js";
import "../pages/index.css";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "097e636c-1d22-4187-8648-ae1fb72a1b4b",
    "Content-Type": "application/json",
  },
});

const editModalBtn = document.querySelector(".profile__edit-btn");
const cardModalBtn = document.querySelector(".profile__add-btn");
const avatarModalBtn = document.querySelector(".profile__avatar-btn");
const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__avatar");

const editModal = document.querySelector("#edit-modal");
const editFormElement = editModal.querySelector(".modal__form");
const editModalCloseBtn = editModal.querySelector(".modal__close");
const editModalNameInput = editModal.querySelector("#profile-name-input");
const editModalDescriptionInput = editModal.querySelector(
  "#profile-description-input"
);

const cardModal = document.querySelector("#add-card-modal");
const cardFormElement = cardModal.querySelector(".modal__form");
const cardSubmitBtn = cardModal.querySelector(".modal__submit-btn");
const cardModalCloseBtn = cardModal.querySelector(".modal__close-btn");
const cardNameInput = cardModal.querySelector("#add-card-name-input");
const cardLinkInput = cardModal.querySelector("#add-card-link-input");

const avatarModal = document.querySelector("#avatar-modal");
const avatarFormElement = avatarModal.querySelector(".modal__form");
const avatarSubmitBtn = avatarModal.querySelector(".modal__submit-btn");
const avatarModalCloseBtn = avatarModal.querySelector(".modal__close");
const avatarLinkInput = avatarModal.querySelector("#profile-avatar-input");

const deleteModal = document.querySelector("#delete-modal");
const confirmDeleteBtn = deleteModal.querySelector('button[type="submit"]');
const cancelDeleteBtn = document.querySelector("#cancel-delete-btn");
const deleteForm = deleteModal.querySelector(".modal__form");

const cardTemplate = document.querySelector("#card-template");
const previewModal = document.querySelector("#preview-modal");
const previewModalImageEl = previewModal.querySelector(".modal__image");
const previewModalCaptionEl = previewModal.querySelector(".modal__caption");
const closePreviewModalBtn = previewModal.querySelector(
  ".modal__close_type_preview"
);
const cardList = document.querySelector(".cards__list");

let selectedCard;
let selectedCardId;
let currentUserId;

api
  .getAppInfo()
  .then(([cards, userData]) => {
    currentUserId = userData._id;

    cards.forEach((item) => {
      const cardEl = getCardElement(item);
      cardList.append(cardEl);
    });

    profileName.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.src = userData.avatar;
  })
  .catch(console.error);

function handleAddCardSubmit(evt) {
  evt.preventDefault();

  const inputValues = {
    name: cardNameInput.value,
    link: cardLinkInput.value,
  };

  api
    .addCard(inputValues)
    .then((newCardData) => {
      if (!Array.isArray(newCardData.likes)) {
        newCardData.likes = [];
      }
      newCardData.owner = { _id: currentUserId };
      const newCard = getCardElement(newCardData);
      cardList.prepend(newCard);
      evt.target.reset();
      disableButton(cardSubmitBtn, settings);
      closeModal(cardModal);
    })
    .catch(console.error);
}

function openPreviewModal(imageSrc, caption) {
  previewModalImageEl.src = imageSrc;
  previewModalCaptionEl.textContent = caption;
  previewModalImageEl.alt = caption;
  openModal(previewModal);
}

closePreviewModalBtn.addEventListener("click", () => closeModal(previewModal));

function getCardElement(data) {
  const cardElement = cardTemplate.content
    .querySelector(".card")
    .cloneNode(true);
  const cardNameEl = cardElement.querySelector(".card__title");
  const cardImageEl = cardElement.querySelector(".card__image");
  const cardLikeBtn = cardElement.querySelector(".card__like-btn");
  const cardDeleteBtn = cardElement.querySelector(".card__delete-btn");

  cardNameEl.textContent = data.name;
  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;

  if (
    Array.isArray(data.likes) &&
    data.likes.some((user) => user._id === currentUserId)
  ) {
    cardLikeBtn.classList.add("card__like-btn_liked");
  }

  cardImageEl.addEventListener("click", () =>
    openPreviewModal(data.link, data.name)
  );
  cardLikeBtn.addEventListener("click", (evt) =>
    handleLike(evt, data._id, cardLikeBtn)
  );
  cardDeleteBtn.addEventListener("click", () =>
    handleDeleteCard(cardElement, data._id)
  );

  return cardElement;
}

function handleLike(evt, id, likeButton) {
  const isLiked = likeButton.classList.contains("card__like-btn_liked");

  api
    .changeLikeStatus(id, isLiked)
    .then((updatedCard) => {
      if (
        updatedCard &&
        Array.isArray(updatedCard.likes) &&
        updatedCard.likes.some((user) => user._id === currentUserId)
      ) {
        likeButton.classList.add("card__like-btn_liked");
      } else {
        likeButton.classList.remove("card__like-btn_liked");
      }
    })
    .catch(console.error);
}

function handleDeleteSubmit(evt) {
  evt.preventDefault();
  api
    .deleteCard(selectedCardId)
    .then(() => {
      selectedCard.remove();
      closeModal(deleteModal);
    })
    .catch(console.error);
}

function handleDeleteCard(cardElement, cardId) {
  selectedCard = cardElement;
  selectedCardId = cardId;
  openModal(deleteModal);
}

confirmDeleteBtn.addEventListener("click", handleDeleteSubmit);
cancelDeleteBtn.addEventListener("click", () => closeModal(deleteModal));
deleteForm.addEventListener("submit", handleDeleteSubmit);

function closeModalByOverlay(evt) {
  if (evt.target === evt.currentTarget) closeModal(evt.currentTarget);
}

function closeModalByEscape(evt) {
  if (evt.key === "Escape") {
    const openModalEl = document.querySelector(".modal_is-opened");
    if (openModalEl) closeModal(openModalEl);
  }
}

function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", closeModalByEscape);
  modal.addEventListener("click", closeModalByOverlay);
}

function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  document.removeEventListener("keydown", closeModalByEscape);
  modal.removeEventListener("click", closeModalByOverlay);
}

function handleEditFormSubmit(evt) {
  evt.preventDefault();
  api
    .editUserInfo({
      name: editModalNameInput.value,
      about: editModalDescriptionInput.value,
    })
    .then((data) => {
      profileName.textContent = data.name;
      profileDescription.textContent = data.about;
      closeModal(editModal);
    })
    .catch(console.error);
}

function handleAvatarSubmit(evt) {
  evt.preventDefault();
  closeModal(avatarModal);
  api
    .editAvatarInfo(avatarLinkInput.value)
    .then((data) => {
      profileAvatar.src = data.avatar;
    })
    .catch(console.error);
}

editModalBtn.addEventListener("click", () => {
  editModalNameInput.value = profileName.textContent;
  editModalDescriptionInput.value = profileDescription.textContent;
  resetValidation(editFormElement, settings);
  openModal(editModal);
});

cardModalBtn.addEventListener("click", () => openModal(cardModal));
cardModalCloseBtn.addEventListener("click", () => closeModal(cardModal));
avatarModalBtn.addEventListener("click", () => openModal(avatarModal));
avatarModalCloseBtn.addEventListener("click", () => closeModal(avatarModal));

avatarFormElement.addEventListener("submit", handleAvatarSubmit);
editFormElement.addEventListener("submit", handleEditFormSubmit);
cardFormElement.addEventListener("submit", handleAddCardSubmit);

enableValidation(settings);
