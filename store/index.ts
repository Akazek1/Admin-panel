import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Redux Persist Configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

// Persisted Reducer
const persistedReducer = persistReducer(persistConfig, authReducer);

// Store Configuration with Persisted Reducer
const store = configureStore({
  reducer: {
    auth: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


export { store, persistor };
