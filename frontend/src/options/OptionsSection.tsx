function OptionsSection({
  title,
  children,
}: {
  title: JSX.Child
  children: JSX.Child
}) {
  return (
    <div class="flex flex-col max-w-xl  mb-8">
      <h3 class="font-bold text-2xl mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default OptionsSection
