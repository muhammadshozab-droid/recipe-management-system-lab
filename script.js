"use strict";

// Array used to store all recipes.
let recipes = [];

// null means we are adding a new recipe.
let editingId = null;

let selectedImage = "";
let imageLoading = false;
let imageVersion = 0;

const storageKey = "recipe-book-lab08";

// Get the HTML elements.
const recipeForm = document.getElementById("recipeForm");
const titleInput = document.getElementById("title");
const ingredientsInput = document.getElementById("ingredients");
const instructionsInput = document.getElementById("instructions");
const imageInput = document.getElementById("image");

const imagePreview = document.getElementById("imagePreview");
const formHeading = document.getElementById("formHeading");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

const searchInput = document.getElementById("search");
const recipeList = document.getElementById("recipeList");
const recipeCount = document.getElementById("recipeCount");
const emptyMessage = document.getElementById("emptyMessage");
const message = document.getElementById("message");

const recipeDialog = document.getElementById("recipeDialog");
const viewTitle = document.getElementById("viewTitle");
const viewImage = document.getElementById("viewImage");
const viewIngredients = document.getElementById("viewIngredients");
const viewInstructions = document.getElementById("viewInstructions");
const closeDialog = document.getElementById("closeDialog");


// Display a success or error message.
function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
}


// Check that an image is an allowed data URL.
function isValidImage(image) {
    if (image === "") {
        return true;
    }

    return typeof image === "string" &&
        /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(image);
}


// Validate recipe information.
function validateRecipe(recipe) {
    const fields = [
        recipe.title,
        recipe.ingredients,
        recipe.instructions
    ];

    for (const field of fields) {
        if (typeof field !== "string" || field.trim() === "") {
            throw new Error("Please fill in all required fields.");
        }
    }

    if (
        recipe.title.length > 100 ||
        recipe.ingredients.length > 5000 ||
        recipe.instructions.length > 10000
    ) {
        throw new Error("One of the fields is too long.");
    }

    if (!isValidImage(recipe.image)) {
        throw new Error("The recipe image is not supported.");
    }
}


// Load previously saved recipes.
function loadRecipes() {
    try {
        const savedData = localStorage.getItem(storageKey);
        const savedRecipes = JSON.parse(savedData || "[]");

        if (!Array.isArray(savedRecipes)) {
            throw new Error("Invalid saved data.");
        }

        const usedIds = new Set();

        for (const recipe of savedRecipes) {
            if (
                !recipe ||
                typeof recipe.id !== "string" ||
                usedIds.has(recipe.id)
            ) {
                throw new Error("Invalid saved recipe.");
            }

            validateRecipe(recipe);
            usedIds.add(recipe.id);
        }

        recipes = savedRecipes;
    } catch (error) {
        showMessage(
            "Saved recipes could not be loaded. Check your browser storage settings.",
            true
        );
    }
}


// Save changes before replacing the current array.
function saveRecipes(updatedRecipes) {
    try {
        localStorage.setItem(
            storageKey,
            JSON.stringify(updatedRecipes)
        );
    } catch (error) {
        throw new Error(
            "Could not save. Browser storage may be blocked or full. Try a smaller image."
        );
    }

    recipes = updatedRecipes;
}


// CREATE: add a new recipe.
function addRecipe(recipe) {
    validateRecipe(recipe);

    const newRecipe = {
        id: Date.now().toString(36) +
            Math.random().toString(36).slice(2),

        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image: recipe.image
    };

    const updatedRecipes = [...recipes, newRecipe];

    saveRecipes(updatedRecipes);
}


// READ: find one recipe.
function findRecipe(id) {
    return recipes.find(function (recipe) {
        return recipe.id === id;
    });
}


// UPDATE: change an existing recipe.
function updateRecipe(id, newData) {
    validateRecipe(newData);

    if (!findRecipe(id)) {
        throw new Error("Recipe not found.");
    }

    const updatedRecipes = recipes.map(function (recipe) {
        if (recipe.id === id) {
            return {
                id: id,
                title: newData.title,
                ingredients: newData.ingredients,
                instructions: newData.instructions,
                image: newData.image
            };
        }

        return recipe;
    });

    saveRecipes(updatedRecipes);
}


// DELETE: remove a recipe.
function deleteRecipe(id) {
    if (!findRecipe(id)) {
        throw new Error("Recipe not found.");
    }

    const updatedRecipes = recipes.filter(function (recipe) {
        return recipe.id !== id;
    });

    saveRecipes(updatedRecipes);
}


// Create a button for a recipe card.
function createButton(text, className, action) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.className = className;

    button.addEventListener("click", action);

    return button;
}


// Display recipes and apply the search filter.
function displayRecipes() {
    recipeList.replaceChildren();

    const searchText = searchInput.value.trim().toLowerCase();

    const matchingRecipes = recipes.filter(function (recipe) {
        const title = recipe.title.toLowerCase();
        const ingredients = recipe.ingredients.toLowerCase();

        return title.includes(searchText) ||
            ingredients.includes(searchText);
    });

    recipeCount.textContent =
        recipes.length + (recipes.length === 1 ? " recipe" : " recipes");

    emptyMessage.hidden = matchingRecipes.length > 0;

    if (recipes.length === 0) {
        emptyMessage.textContent =
            "No recipes added yet. Add your first recipe!";
    } else {
        emptyMessage.textContent = "No matching recipes found.";
    }

    for (const recipe of matchingRecipes) {
        const card = document.createElement("article");
        card.className = "recipe-card";

        // Add the recipe image or a placeholder.
        if (recipe.image) {
            const image = document.createElement("img");

            image.src = recipe.image;
            image.alt = recipe.title;

            card.appendChild(image);
        } else {
            const placeholder = document.createElement("div");

            placeholder.className = "no-image";
            placeholder.textContent = "No image added";

            card.appendChild(placeholder);
        }

        const content = document.createElement("div");
        content.className = "card-content";

        const title = document.createElement("h3");
        title.textContent = recipe.title;

        const ingredients = document.createElement("p");
        ingredients.textContent =
            recipe.ingredients.slice(0, 100) +
            (recipe.ingredients.length > 100 ? "..." : "");

        const buttons = document.createElement("div");
        buttons.className = "card-buttons";

        const viewButton = createButton(
            "View",
            "",
            function () {
                viewRecipe(recipe.id);
            }
        );

        const editButton = createButton(
            "Edit",
            "secondary",
            function () {
                editRecipe(recipe.id);
            }
        );

        const deleteButton = createButton(
            "Delete",
            "delete-button",
            function () {
                handleDelete(recipe.id);
            }
        );

        buttons.append(viewButton, editButton, deleteButton);
        content.append(title, ingredients, buttons);
        card.appendChild(content);
        recipeList.appendChild(card);
    }
}


// Show a full recipe in a popup.
function viewRecipe(id) {
    const recipe = findRecipe(id);

    if (!recipe) {
        return;
    }

    viewTitle.textContent = recipe.title;
    viewIngredients.textContent = recipe.ingredients;
    viewInstructions.textContent = recipe.instructions;

    viewImage.hidden = !recipe.image;
    viewImage.alt = recipe.title;

    if (recipe.image) {
        viewImage.src = recipe.image;
    } else {
        viewImage.removeAttribute("src");
    }

    recipeDialog.showModal();
}


// Fill the form with an existing recipe.
function editRecipe(id) {
    const recipe = findRecipe(id);

    if (!recipe) {
        return;
    }

    resetForm();

    editingId = recipe.id;
    selectedImage = recipe.image;

    titleInput.value = recipe.title;
    ingredientsInput.value = recipe.ingredients;
    instructionsInput.value = recipe.instructions;

    formHeading.textContent = "Edit Recipe";
    saveButton.textContent = "Save Changes";
    cancelButton.hidden = false;

    if (recipe.image) {
        imagePreview.src = recipe.image;
        imagePreview.hidden = false;
    }

    showMessage(
        "Update the fields and click Save Changes. Upload a new image only if you want to replace the current one."
    );

    titleInput.focus();

    recipeForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// Confirm deletion before removing a recipe.
function handleDelete(id) {
    const recipe = findRecipe(id);

    if (!recipe) {
        return;
    }

    const confirmed = confirm(
        'Are you sure you want to delete "' + recipe.title + '"?'
    );

    if (!confirmed) {
        return;
    }

    try {
        deleteRecipe(id);

        if (editingId === id) {
            resetForm();
        }

        displayRecipes();
        showMessage("Recipe deleted successfully.");
    } catch (error) {
        showMessage(error.message, true);
    }
}


// Return the form to add mode.
function resetForm() {
    imageVersion++;

    recipeForm.reset();

    editingId = null;
    selectedImage = "";
    imageLoading = false;

    formHeading.textContent = "Add a Recipe";
    saveButton.textContent = "Add Recipe";
    saveButton.disabled = false;
    cancelButton.hidden = true;

    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");
}


// Add or update a recipe when the form is submitted.
recipeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (imageLoading) {
        return;
    }

    const recipe = {
        title: titleInput.value.trim(),
        ingredients: ingredientsInput.value.trim(),
        instructions: instructionsInput.value.trim(),
        image: selectedImage
    };

    try {
        const isEditing = editingId !== null;

        if (isEditing) {
            updateRecipe(editingId, recipe);
        } else {
            addRecipe(recipe);
        }

        searchInput.value = "";

        resetForm();
        displayRecipes();

        showMessage(
            isEditing
                ? "Recipe updated successfully."
                : "Recipe added successfully."
        );
    } catch (error) {
        showMessage(error.message, true);
    }
});


// Read and preview a selected image.
imageInput.addEventListener("change", function () {
    const currentVersion = ++imageVersion;
    const file = imageInput.files[0];

    imageLoading = false;
    saveButton.disabled = false;

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowedTypes.includes(file.type)) {
        imageInput.value = "";
        showMessage("Please select a JPG, PNG, WebP or GIF image.", true);
        return;
    }

    if (file.size > 1024 * 1024) {
        imageInput.value = "";
        showMessage("Please select an image no larger than 1 MB.", true);
        return;
    }

    imageLoading = true;
    saveButton.disabled = true;

    const reader = new FileReader();

    function imageFailed() {
        if (currentVersion !== imageVersion) {
            return;
        }

        imageLoading = false;
        saveButton.disabled = false;
        imageInput.value = "";

        showMessage("The image could not be read. Try another image.", true);
    }

    reader.onload = function () {
        if (currentVersion !== imageVersion) {
            return;
        }

        // Check that the selected file can actually load as an image.
        const image = new Image();

        image.onload = function () {
            if (currentVersion !== imageVersion) {
                return;
            }

            selectedImage = reader.result;

            imagePreview.src = selectedImage;
            imagePreview.hidden = false;

            imageLoading = false;
            saveButton.disabled = false;

            showMessage("Image selected successfully.");
        };

        image.onerror = imageFailed;
        image.src = reader.result;
    };

    reader.onerror = imageFailed;
    reader.readAsDataURL(file);
});


// Search while the user types.
searchInput.addEventListener("input", displayRecipes);


// Cancel editing without changing the saved recipe.
cancelButton.addEventListener("click", function () {
    resetForm();
    showMessage("Editing cancelled.");
});


// Close the recipe popup.
closeDialog.addEventListener("click", function () {
    recipeDialog.close();
});


// Load and display recipes when the page opens.
loadRecipes();
displayRecipes();