function OptionLine({
  input,
  label,
}: {
  input: JSX.Element
  label: JSX.Child
}) {
  return (
    <div class="px-2 first-of-type:border-t-[1px] border-b-[1px] border-solid border-[currentColor] hover:bg-pink-500 hover:bg-opacity-10">
      <div class="label">
        <span class="label-text">{label}</span>
        {input}
      </div>
    </div>
  )
}

export default OptionLine
