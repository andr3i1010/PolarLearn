import React, { memo, useCallback } from 'react';

type Item = {
    id: string;
    [key: string]: any;
};

type MemoizedListProps<T extends Item> = {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    keyExtractor?: (item: T) => string;
    onItemClick?: (item: T) => void;
    className?: string;
};

function MemoizedList<T extends Item>({
    items,
    renderItem,
    keyExtractor = (item) => item.id,
    onItemClick,
    className = '',
}: MemoizedListProps<T>) {
    const handleItemClick = useCallback(
        (item: T) => {
            onItemClick?.(item);
        },
        [onItemClick]
    );

    return (
        <ul className={className}>
            {items.map((item, index) => (
                <li
                    key={keyExtractor(item)}
                    onClick={onItemClick ? () => handleItemClick(item) : undefined}
                >
                    {renderItem(item, index)}
                </li>
            ))}
        </ul>
    );
}

export default memo(MemoizedList) as typeof MemoizedList;

// Usage example (don't include this in the file):
// 
// const ItemComponent = memo(({ item }: { item: MyItem }) => (
//   <div>{item.name}</div>
// ));
//
// function MyComponent({ items }: { items: MyItem[] }) {
//   const renderItem = useCallback((item: MyItem) => (
//     <ItemComponent item={item} />
//   ), []);
//
//   return (
//     <MemoizedList 
//       items={items}
//       renderItem={renderItem}
//     />
//   );
// }
