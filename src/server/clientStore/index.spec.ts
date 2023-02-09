import { createClientStore } from '.'

describe('clientStore', () => {
  describe('createClientStore', () => {
    const fn = createClientStore

    test('basic test', () => {
      // -- Act
      const instance = fn()

      // -- Assert
      expect(instance.clientList).toEqual([])
      expect(instance.clients).toEqual({ })
      expect(instance.count).toBe(0)

      // -- Act
      instance.add({ uuid: 'foo', ws: 1 as any })

      // -- Assert
      expect(instance.clientList).toEqual([
        { uuid: 'foo', shortUuid: 'foo', ws: 1 },
      ])
      expect(instance.clients).toEqual({
        foo: { uuid: 'foo', shortUuid: 'foo', ws: 1 },
      })
      expect(instance.count).toBe(1)

      // -- Act
      instance.add({ uuid: '0123456789', ws: 2 as any })

      // -- Assert
      expect(instance.clientList).toEqual([
        { uuid: 'foo', shortUuid: 'foo', ws: 1 },
        { uuid: '0123456789', shortUuid: '01234567', ws: 2 },
      ])
      expect(instance.clients).toEqual({
        foo: { uuid: 'foo', shortUuid: 'foo', ws: 1 },
        '0123456789': { uuid: '0123456789', shortUuid: '01234567', ws: 2 },
      })
      expect(instance.count).toBe(2)

      // -- Act
      instance.remove('')

      // -- Assert
      expect(instance.clientList).toEqual([
        { uuid: 'foo', shortUuid: 'foo', ws: 1 },
        { uuid: '0123456789', shortUuid: '01234567', ws: 2 },
      ])
      expect(instance.clients).toEqual({
        foo: { uuid: 'foo', shortUuid: 'foo', ws: 1 },
        '0123456789': { uuid: '0123456789', shortUuid: '01234567', ws: 2 },
      })
      expect(instance.count).toBe(2)

      // -- Act
      instance.remove('foo')

      // -- Assert
      expect(instance.clientList).toEqual([
        { uuid: '0123456789', shortUuid: '01234567', ws: 2 },
      ])
      expect(instance.clients).toEqual({
        '0123456789': { uuid: '0123456789', shortUuid: '01234567', ws: 2 },
      })
      expect(instance.count).toBe(1)

      // -- Act
      instance.remove('0123456789')

      // -- Assert
      expect(instance.clientList).toEqual([])
      expect(instance.clients).toEqual({ })
      expect(instance.count).toBe(0)
    })
  })
})
