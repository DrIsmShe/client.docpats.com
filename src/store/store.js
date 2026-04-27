import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "../slices/menuSlice";
import synthesisReducer from "../slices/synthesisSlice";
import surgeryReducer from "../pages/surgery/surgerySlice";

// Anthropometry module reducers
import anthroCasesReducer from "../pages/anthropometry/store/casesSlice";
import anthroStudiesReducer from "../pages/anthropometry/store/studiesSlice";
import anthroPhotosReducer from "../pages/anthropometry/store/photosSlice";
import anthroAnnotationsReducer from "../pages/anthropometry/store/annotationsSlice";
import simulationReducer from "../pages/simulation/store/simulationSlice";
export const store = configureStore({
  reducer: {
    menu: menuReducer,
    synthesis: synthesisReducer,
    surgery: surgeryReducer,

    // Anthropometry module
    anthroCases: anthroCasesReducer,
    anthroStudies: anthroStudiesReducer,
    anthroPhotos: anthroPhotosReducer,
    anthroAnnotations: anthroAnnotationsReducer,
    simulation: simulationReducer,
  },
});
