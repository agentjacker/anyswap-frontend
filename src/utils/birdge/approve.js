import { ethers } from 'ethers'
import config from '../../config'
import ERC20_ABI from '../../constants/abis/erc20'
import {getLocalConfig, setLocalConfig} from '../tools'
import {getWeb3ConTract} from '../web3/txns'

const BRIDGE_APPROVE = 'BRIDGE_APPROVE'

let contract = getWeb3ConTract(ERC20_ABI)
// console.log(contract)
let getApproveInfoObj = {}

function getAllowance (account, token, chainID, inputCurrency) {
  return new Promise(resolve => {
    contract.options.address = inputCurrency
    contract.methods.allowance(account, token).call((err, res) => {
      // console.log(err)
      // console.log(res)
      if (!err) {
        setLocalConfig(account, token, {approve: res}, chainID, BRIDGE_APPROVE)
      }
      resolve(res)
    })
  })
}

export function getAllowanceInfo (account, token, chainID, inputCurrency) {
  // console.log(account)
  // console.log(token)
  // console.log(inputCurrency)
  // console.log(chainID)
  getApproveInfoObj = {account, token}
  // count ++
  return new Promise(resolve => {
    if (!account) {
      resolve('')
    } else {
      let lData = getLocalConfig(getApproveInfoObj.account, getApproveInfoObj.token, chainID, BRIDGE_APPROVE)
      if (!lData) {
        getAllowance(account, token, chainID, inputCurrency).then(result => {
          let lData = getLocalConfig(getApproveInfoObj.account, getApproveInfoObj.token, chainID, BRIDGE_APPROVE)
          if (lData) {
            resolve(lData)
          } else {
            resolve({
              msg: 'Null'
            })
          }
        })
      } else {
        resolve(lData)
      }
    }
  })
}