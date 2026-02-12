function OptionLine({
  input,
  label,
}: {
  input: JSX.Element
  label: JSX.Child
}) {
  return (
    <div class="px-2 first-of-type:border-t border-b border-solid border-[currentColor] hover:bg-pink-500/10">
      <div class="label flex justify-between padding-y-[0.5rem] padding-x[0.25rem]">
        <span class="label-text dark:text-primary">{label}</span>
        {input}
      </div>
    </div>
  )
}

export default OptionLine
