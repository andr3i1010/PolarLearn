...
            {recentLists.length > 0 && (
              <>
                <div className="flex items-center text-center">
                  <h1 className="text-4xl pl-5 pt-4 mb-2 font-extrabold">Recente Lijsten:</h1>
                  <div className="ml-auto mr-5">
                    <PlusBtn redir="/learn/createlist" />
                  </div>
                </div>
                <div className="h-4" />
                <div className="space-y-4">
                  {recentLists.map((list: any, index: number) => (
                    <div key={index}>
                      <Link href={`/learn/viewlist/${list.list_id}`}>
                        <div className="tile bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg h-20 flex items-center justify-between cursor-pointer">
                          <div className="flex flex-col text-left">
                            <div className="flex items-center">
                              {list.subject && (
                                <Image
                                  src={
                                    list.subject === "NL" ? nl_img :
                                    list.subject === "DE" ? de_img :
                                    list.subject === "FR" ? fr_img :
                                    list.subject === "EN" ? eng_img :
                                    list.subject === "WI" ? math_img :
                                    list.subject === "NSK" ? nsk_img :
                                    list.subject === "GS" ? gs_img :
                                    list.subject === "BI" ? bi_img : ''
                                  }
                                  alt={`${list.subject} icon`}
                                  width={24}
                                  height={24}
                                  className="mr-2"
                                />
                              )}
                              <span className="text-lg">{list.name}</span>
                            </div>
                          </div>
                          {list.creator && (
                            <div className="flex items-center text-sm text-neutral-400">
                              <CreatorLink creator={list.creator} />
                            </div>
                          )}
                          <div className="text-neutral-400 text-sm">
                            {Array.isArray(list.data) && list.data.length === 1
                              ? "1 woord"
                              : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
...
