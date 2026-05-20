export const MyUserReducer = (current, action) => {
    switch (action.type) {
        case "LOGIN":
            return action.payload;
        case "LOGOUT":
            return null;
        case "UPDATE":
            return { ...current, ...action.payload };
    }
    return current;
};
