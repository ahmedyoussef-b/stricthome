// src/components/FormContainer.tsx
import FormModal from "./FormModal";
import type { FormContainerProps } from "@/components/forms/types";

// This is now a simple wrapper component.
// All data-fetching logic has been moved to the individual pages/forms that need it.
const FormContainer = (props: FormContainerProps) => {
  // Pass all props, including className, down to the FormModal
  return <FormModal {...props} />;
};

export default FormContainer;
