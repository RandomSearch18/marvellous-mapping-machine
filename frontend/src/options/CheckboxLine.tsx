function CheckboxLine({
  input,
  label,
}: {
  input: JSX.Element
  label: JSX.Child
}) {
  return (
    <div class="form-control px-2 first-of-type:border-t-[1px] border-b-[1px] border-solid border-[currentColor] hover:bg-pink-500 hover:bg-opacity-10">
      <label class="label cursor-pointer">
        <span class="label-text">{label}</span>
        {input}
      </label>
    </div>
  )
}

export default CheckboxLine
