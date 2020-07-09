import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { transparentize } from 'polished'

import { isAddress } from '../../utils'
import { useWeb3React, useDebounce } from '../../hooks'

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadowColor)};
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({theme}) => theme.bgColor};
  z-index: 1;
  padding: 25px 40px;
  margin-top: 10px;
`

const ContainerRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`

const InputContainer = styled.div`
  flex: 1;
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem;
`

const LabelContainer = styled.div`
  flex: 1 1 auto;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.25rem 0.85rem 0.75rem;
`

const Input = styled.input`
  font-size: 1rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: transparent;
  border-bottom: 1px solid ${({theme}) => theme.textColorBold};

  color: ${({ error, theme }) => (error ? theme.salmonRed : theme.royalBlue)};
  overflow: hidden;
  text-overflow: ellipsis;

  ::placeholder {
    color: ${({ theme }) => theme.placeholderGray};
  }
`

export default function AddressInputPanel({ title, initialInput = '', onChange = () => {}, onError = () => {}, isValid = false, disabled = false }) {
  const { t } = useTranslation()

  const { library } = useWeb3React()

  const [input, setInput] = useState(initialInput.address ? initialInput.address : '')

  const debouncedInput = useDebounce(input, 150)
  // console.log(debouncedInput)
  const [data, setData] = useState({ address: undefined, name: undefined })
  const [error, setError] = useState(false)


  // keep data and errors in sync
  useEffect(() => {
    onChange({ address: data.address, name: data.name })
  }, [onChange, data.address, data.name])
  useEffect(() => {
    onError(error)
  }, [onError, error])

  // run parser on debounced input
  useEffect(() => {
    let stale = false
    // console.log('isAddress', isAddress(debouncedInput))
    // console.log('isValid', isValid)
    if (isAddress(debouncedInput) || isValid) {
      try {
        library
          .lookupAddress(debouncedInput)
          .then(name => {
            if (!stale) {
              // if an ENS name exists, set it as the destination
              if (name) {
                setInput(name)
              } else {
                setData({ address: debouncedInput, name: '' })
                setError(null)
              }
            }
          })
          .catch(() => {
            if (!stale) {
              setData({ address: debouncedInput, name: '' })
              setError(null)
            }
          })
      } catch {
        setData({ address: debouncedInput, name: '' })
        setError(null)
      }
    } else {
      if (debouncedInput !== '') {
        try {
          library
            .resolveName(debouncedInput)
            .then(address => {
              if (!stale) {
                // if the debounced input name resolves to an address
                if (address) {
                  setData({ address: address, name: debouncedInput })
                  setError(null)
                } else {
                  setError(true)
                }
              }
            })
            .catch(() => {
              if (!stale) {
                setError(true)
              }
            })
        } catch {
          setError(true)
        }
      }
    }

    return () => {
      stale = true
    }
  }, [debouncedInput, library, onChange, onError])

  function onInput(event) {
    if (data.address !== undefined || data.name !== undefined) {
      setData({ address: undefined, name: undefined })
    }
    if (error !== undefined) {
      setError()
    }
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setInput(checksummedInput || input)
  }

  return (
    <InputPanel>
      <ContainerRow error={input !== '' && error}>
        <InputContainer>
          <LabelRow>
            <LabelContainer>
              <span>{title || t('recipientAddress')}</span>
            </LabelContainer>
          </LabelRow>
          <InputRow>
            <Input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder=""
              error={input !== '' && error}
              onChange={onInput}
              value={input}
              disabled={disabled}
            />
          </InputRow>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
