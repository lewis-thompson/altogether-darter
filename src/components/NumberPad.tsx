type Props = {
  onInput: (value: string) => void
}

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function NumberPad({ onInput }: Props) {
  return (
    <div>
      <div>
        {numbers.map((value) => (
          <button key={value} type="button" onClick={() => onInput(value.toString())}>
            {value}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onInput('bullseye')}>
        Bullseye
      </button>
      <button type="button" onClick={() => onInput('miss')}>
        Miss
      </button>
    </div>
  )
}
