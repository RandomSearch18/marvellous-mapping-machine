import { $$, FunctionMaybe } from "voby"

const buttonClasses = ["btn", "btn-outline", "join-item", "hover:btn-inset"]
const selectedClasses = ["btn-inset"]

function CombiButtonButton({
  active,
  onClick,
  children,
  classes,
}: {
  active?: FunctionMaybe<boolean>
  onClick?: (event: MouseEvent) => void
  children?: JSX.Child
  classes?: JSX.Class
}) {
  return (
    <button
      class={() => [
        ...buttonClasses,
        $$(active) ? selectedClasses : null,
        classes,
      ]}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default CombiButtonButton
