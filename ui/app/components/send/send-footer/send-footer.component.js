import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerFooter from '../../page-container/page-container-footer'
import { CONFIRM_TRANSACTION_ROUTE, DEFAULT_ROUTE } from '../../../routes'
import CashAccount from '../../../../../app/scripts/lib/cashaccount'
import localStorage from 'store'

const bchaddr = require('bchaddrjs-slp')

export default class SendFooter extends Component {
  static propTypes = {
    addToAddressBookIfNew: PropTypes.func,
    amount: PropTypes.string,
    data: PropTypes.string,
    clearSend: PropTypes.func,
    disabled: PropTypes.bool,
    editingTransactionId: PropTypes.string,
    errors: PropTypes.object,
    from: PropTypes.object,
    history: PropTypes.object,
    inError: PropTypes.bool,
    selectedToken: PropTypes.object,
    sign: PropTypes.func,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    tokenBalance: PropTypes.string,
    unapprovedTxs: PropTypes.object,
    update: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    err: '',
  }

  onCancel () {
    this.props.clearSend()
    this.props.history.push(DEFAULT_ROUTE)
  }

  async onSubmit (event) {
    event.preventDefault()
    const {
      addToAddressBookIfNew,
      amount,
      data,
      editingTransactionId,
      from: { address: from },
      selectedToken,
      sign,
      unapprovedTxs,
      // updateTx,
      update,
      history,
    } = this.props
    let { to, toAccounts } = this.props

    if (CashAccount.isCashAccount(to)) {
      toAccounts.name = to
      // const addr = await CashAccount.getAddressByCashAccount(to)
      const addr = await CashAccount.getAccountInfo(to)
      console.log('addr', addr, typeof addr)

      if (Object.keys(addr).length === 0) {
        return this.setState({ err: 'not a valid cash account' })
      } else {
        localStorage.set('cashAccount', addr.information)
        this.setState({ err: '' })
        const { payment } = addr.information
        let type

        if (payment.length === 2 && selectedToken) {
          to = bchaddr.toSlpAddress(payment[1].address)
          type = payment[1].type
        } else {
          to = payment[0].address
          type = payment[0].type
        }

        toAccounts.address = to

        if (type === 'Payment Code') {
          this.setState({ err: 'Payment type not supported yet' })
        }
      }
    }

    // Should not be needed because submit should be disabled if there are errors.
    // const noErrors = !amountError && toError === null

    // if (!noErrors) {
    //   return
    // }

    // TODO: add nickname functionality
    addToAddressBookIfNew(to, toAccounts)

    const promise = editingTransactionId
      ? update({
          amount,
          data,
          editingTransactionId,
          from,
          selectedToken,
          to,
          unapprovedTxs,
        })
      : sign({ data, selectedToken, to, amount, from })

    if (this.state.err === '') {
      Promise.resolve(promise).then(() => {
        this.setState({ err: '' })
        history.push(CONFIRM_TRANSACTION_ROUTE)
      })
    }
  }

  formShouldBeDisabled () {
    const { err } = this.state
    const { inError, selectedToken, to } = this.props
    // clear error msg
    if (err && to === '') {
      this.setState({ err: '' })
    }

    const missingTokenBalance = selectedToken && !selectedToken.string
    return inError || missingTokenBalance || !to
  }

  render () {
    const { err } = this.state

    return (
      <PageContainerFooter
        onCancel={() => this.onCancel()}
        onSubmit={e => this.onSubmit(e)}
        disabled={this.formShouldBeDisabled()}
      >
        {err !== '' && (
          <div
            style={{
              position: 'absolute',
              top: '-28px',
              fontSize: '12px',
              lineHeight: '12px',
              color: '#f00',
            }}
          >
            {err}
          </div>
        )}
      </PageContainerFooter>
    )
  }
}
