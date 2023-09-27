const blockedCharacters = new RegExp(
    "[~`!@#$%^&()_={}\\[\\]\\:;,\\.\\/<>\\\\*\\-+\\?]"
);

function hasOnlyNumbersAndLetters(value) {
    if (blockedCharacters.test(value)) {
        console.log("INVALID REGEX CHARS SPOTTED");
        return false;
    } else {
        return true;
    }
}

function areIdentical(oldData, newData) {
    let categories = Object.keys(oldData);
    let allMatch = true;
    for (key of categories) {
        if (newData[key] !== oldData[key]) {
            allMatch = false;
        }
    }
    return allMatch;
}

// Credit to Icepickle on StackOverflow
// URL: https://stackoverflow.com/questions/56168771/how-to-limit-for-10-results-the-array-filter
function* limitedArrayPull(array, condition, maxSize) {
    if (array === null || array === undefined) {
        console.log("NO ARRAY???");
        return [];
    }
    if (!maxSize || maxSize > array.length) {
        maxSize = array.length;
    }
    let count = 0;
    let i = array.length - 1;
    // while ( count < maxSize && i < array.length ) {
    while (count < maxSize && i >= 0) {
        if (condition(array[i])) {
            yield array[i];
            count++;
        }
        i--;
    }
}

function userNameIsAvailable(username, allCredentials) {
    const index = allCredentials.registeredUsers.findIndex((item) => {
        return item.username === username;
    });
    return index === -1;
}

function getUser(username, allCredentials) {
    return allCredentials.registeredUsers.filter(
        (item) => item.username === username
    )[0];
}

function getUserByCartId(cartId, allCredentials) {
    return allCredentials.registeredUsers.filter(
        (item) => item.cartId === cartId
    )[0];
}

module.exports = {
    hasOnlyNumbersAndLetters,
    userNameIsAvailable,
    limitedArrayPull,
    areIdentical,
    getUser,
    getUserByCartId,
};
